git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/StockDispatch.git
docker-compose down
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi -f $(docker images -q)
docker system prune -a
docker-compose build
docker-compose up -d

# git pull https://nguyenhongphuc98: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@github.com/Nguyenhongphuc98/Export-manager-Web.git

