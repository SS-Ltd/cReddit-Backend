pipeline {
    agent any
    stages {
        stage('cp env file'){
            when {
                anyOf {
                    changeRequest target: 'main'
                    branch 'main'
                }
            }
            steps {
                sh 'cp /home/jenkins/.env .'
            }
        }

        stage('Build & test') {
            when {
                anyOf {
                    changeRequest target: 'main'
                    branch 'main'
                }
            }
            steps {
                 sh 'docker build . -t moa234/creddit_backend'
            }
        }

        stage('push to registery') {
            when{
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'creddit-dockerhub', passwordVariable: 'dockerHubPassword', usernameVariable: 'dockerHubUser')]) {
                    sh "docker login -u ${env.dockerHubUser} -p ${env.dockerHubPassword}"
                    sh 'docker push moa234/creddit_backend'
                }
            }
        }

        stage('rebuild docker compose'){
            when{
                branch 'main'
            }
            steps {
                sh '/home/jenkins/rebuild_backend.sh'
            }
        }
    }
}
