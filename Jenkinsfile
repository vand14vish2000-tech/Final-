pipeline {
    agent any

    environment {
        APP_NAME       = 'product-catalog'
        FRONTEND_IMAGE = 'product-frontend'
        BACKEND_IMAGE  = 'product-backend'
        
        // 🚨 STEP 1: CHANGE THIS to your actual AWS EC2 Public IP address!
        EC2_PUBLIC_IP   = 'YOUR_EC2_PUBLIC_IP_HERE'
        
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    stages {
        stage('Clean Environment') {
            steps {
                echo 'Cleaning up any old running containers and local images...'
                // Cleans out stale tunnels so ports 3000 and 5000 are freed up
                sh 'pkill -f "port-forward" || true'
                sh 'docker compose down --volumes --remove-orphans || true'
                sh 'docker system prune -f || true'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building fresh production Docker images via compose...'
                // Passes your EC2 IP into the build so the browser code knows where port 5000 lives
                sh "REACT_APP_API_URL=http://${EC2_PUBLIC_IP}:5000 docker compose build --no-cache"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing images...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub', 
                                                 passwordVariable: 'DOCKER_PASS', 
                                                 usernameVariable: 'DOCKER_NAMESPACE')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_NAMESPACE" --password-stdin
                        
                        REAL_FRONTEND=$(docker images --format "{{.Repository}}" | grep frontend | head -n 1)
                        REAL_BACKEND=$(docker images --format "{{.Repository}}" | grep backend | head -n 1)
                        
                        docker tag "$REAL_FRONTEND" "${DOCKER_NAMESPACE}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        docker tag "$REAL_BACKEND" "${DOCKER_NAMESPACE}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        
                        docker push "${DOCKER_NAMESPACE}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        docker push "${DOCKER_NAMESPACE}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes (KinD on EC2)') {
            steps {
                echo 'Deploying manifests directly to the local KinD cluster on EC2...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub', 
                                                 passwordVariable: 'DOCKER_PASS', 
                                                 usernameVariable: 'DOCKER_NAMESPACE')]) {
                    sh """
                        kind load docker-image "${DOCKER_NAMESPACE}/${FRONTEND_IMAGE}:${BUILD_NUMBER}" --name my-cluster
                        kind load docker-image "${DOCKER_NAMESPACE}/${BACKEND_IMAGE}:${BUILD_NUMBER}" --name my-cluster
                        
                        sed -i "s|DOCKER_NAMESPACE_PLACEHOLDER|${DOCKER_NAMESPACE}|g" k8s/manifests.yaml
                        sed -i "s|IMAGE_TAG_PLACEHOLDER|${BUILD_NUMBER}|g" k8s/manifests.yaml
                        sed -i "s|BACKEND_API_URL_PLACEHOLDER|http://${EC2_PUBLIC_IP}:5000|g" k8s/manifests.yaml
                        
                        kubectl apply -f k8s/manifests.yaml
                    """
                }
            }
        }

        stage('Verify & Expose Externally') {
            steps {
                echo 'Verifying Kubernetes Pods rollout status...'
                sh 'kubectl rollout status deployment/product-frontend --timeout=30s'
                sh 'kubectl rollout status deployment/product-backend --timeout=30s'
                
                echo 'Establishing background tunnels for external browser visibility...'
                // Tunnels Port 3000 for the UI web files
                sh 'nohup kubectl port-forward --address 0.0.0.0 service/product-frontend-service 3000:80 > pf_frontend.log 2>&1 &'
                // Tunnels Port 5000 for data communication
                sh 'nohup kubectl port-forward --address 0.0.0.0 service/product-backend-service 5000:5000 > pf_backend.log 2>&1 &'
                
                sh 'sleep 3'
                sh 'kubectl get pods'
            }
        }
    }

    post {
        success {
            echo 'Success! Your production application is live on Kubernetes (KinD) on EC2!'
            echo "🌐 Open Frontend: http://${EC2_PUBLIC_IP}:3000"
            echo "⚙️ Open Backend API: http://${EC2_PUBLIC_IP}:5000"
        }
        failure {
            echo 'Pipeline failed. Please check the stage logs above for syntax or runtime errors.'
        }
    }
}