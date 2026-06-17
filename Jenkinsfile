pipeline {
    agent any

    environment {
        APP_NAME = 'product-catalog'
    }

    stages {
        stage('Clean Environment') {
            steps {
                echo 'Cleaning up any old running containers...'
                // Brings down any previous builds and purges isolated volumes safely
                sh 'docker compose down --volumes --remove-orphans || true'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building fresh production Docker images...'
                // Forces docker-compose to rebuild without old cached layers
                sh 'docker compose build --no-cache'
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Launching application containers on AWS...'
                // Spins up frontend, backend, and DB in detached background mode
                sh 'docker compose up -d'
            }
        }

        stage('Verify Status') {
            steps {
                echo 'Verifying application runtime status...'
                sh 'sleep 5'
                sh 'docker ps'
            }
        }
    }

    post {
        success {
            echo 'Success! Your production application is live on AWS!'
        }
        failure {
            echo 'Pipeline failed. Please check the stage logs above for syntax or runtime errors.'
        }
    }
}