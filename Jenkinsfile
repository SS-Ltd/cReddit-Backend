pipeline {
    agent any
    stages {
        stage('cp env file'){
            steps {
                sh 'cp /home/jenkins/.env .'
            }
        }

        stage('Build & test') {
            steps {
                 sh 'docker build . -t moa234/creddit_backend'
            }
        }

        stage('push to registery') {
            steps {
                sh 'docker push moa234/creddit_backend'
            }
        }

        stage('rebuild docker compose'){
            steps {
                withCredentials([usernamePassword(credentialsId: 'creddit-dockerhub', passwordVariable: 'dockerHubPassword', usernameVariable: 'dockerHubUser')]) {
                    sh "docker login -u ${env.dockerHubUser} -p ${env.dockerHubPassword}"
                    sh '/home/jenkins/rebuild_backend.sh'
                }
            }
        }
    }
}
