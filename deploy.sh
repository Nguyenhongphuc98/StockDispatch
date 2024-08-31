git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/StockDispatch.git
docker-compose down
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi -f $(docker images -q)
docker volume rm $(docker volume ls -q)
docker system prune -a --volumes
docker-compose build
docker-compose up

# git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/Export-manager-Web.git

