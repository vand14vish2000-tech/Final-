pipeline {
    agent any

    environment {
        APP_NAME       = 'product-catalog'
        FRONTEND_IMAGE = 'product-frontend'
        BACKEND_IMAGE  = 'product-backend'
        
        // Force Jenkins to recognize executable folders on your EC2 instance
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    stages {
        stage('Clean Environment') {
            steps {
                echo 'Cleaning up any old running containers and local images...'
                // Brings down any previous local compose builds
                sh 'docker compose down --volumes --remove-orphans || true'
                sh 'docker system prune -f || true'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building fresh production Docker images via compose...'
                // Forces docker-compose to rebuild without old cached layers
                sh 'docker compose build --no-cache'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing images...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub', 
                                                  passwordVariable: 'DOCKER_PASS', 
                                                  usernameVariable: 'DOCKER_NAMESPACE')]) {
                    sh '''
                        # Login to Docker Hub using secure environment variables
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_NAMESPACE" --password-stdin
                        
                        # Tag the images built by compose to your Docker Hub repository with the unique build number
                        docker tag ${FRONTEND_IMAGE}:latest "${DOCKER_NAMESPACE}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        docker tag ${BACKEND_IMAGE}:latest "${DOCKER_NAMESPACE}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        
                        # Push them to your cloud repository
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
                        # 1. Load the freshly built images straight into your local KinD cluster nodes
                        kind load docker-image "${DOCKER_NAMESPACE}/${FRONTEND_IMAGE}:${BUILD_NUMBER}" --name my-cluster
                        kind load docker-image "${DOCKER_NAMESPACE}/${BACKEND_IMAGE}:${BUILD_NUMBER}" --name my-cluster
                        
                        # 2. Replace placeholders in your k8s/manifests.yaml file
                        sed -i "s|DOCKER_NAMESPACE_PLACEHOLDER|${DOCKER_NAMESPACE}|g" k8s/manifests.yaml
                        sed -i "s|IMAGE_TAG_PLACEHOLDER|${BUILD_NUMBER}|g" k8s/manifests.yaml
                        
                        # 3. Apply the changes to Kubernetes
                        kubectl apply -f k8s/manifests.yaml
                    """
                }
            }
        }

        stage('Verify Status') {
            steps {
                echo 'Verifying Kubernetes Pods rollout status...'
                sh 'sleep 5'
                sh 'kubectl get pods'
            }
        }
    }

    post {
        success {
            echo 'Success! Your production application is live on Kubernetes (KinD) on EC2!'
        }
        failure {
            echo 'Pipeline failed. Please check the stage logs above for syntax or runtime errors.'
        }
    }
}