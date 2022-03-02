# セットアップ

.env.exampleをコピーして各環境に合うように適宜書き換える。

```shell script
cp .env.example .env
```

# デプロイ環境の立ち上げ

docker-compose.ymlは必要がなければ書き換える必要なし。

```shell script
make build
make up
```

コンテナを立ち上げたらCDKが利用するきキットをCloudFormationスタックとしAWSにデプロイする

※ CDKが利用するCloudFormationがすでにあれば必要なし

```shell script
docker-compose exec aws-cdk sh -c 'cdk bootstrap aws://AWS_ACCOUNT_ID/AWS_REGION'
```

# デプロイ

コンテナ内でCDKのデプロイを実行する。

デプロイするStackを指定したい時、Stack名を変えたときは個別実行などでやる。

※初期内容は全Stackを個別にデプロイしている。

```shell script
make deploy
```

# デストロイ

コンテナ内でdeploy.shを実行させ、CDKのデストロイを実行する。

このコマンドは全Stackをデストロイする仕様になっているので、指定したい場合は個別でスタックを指定してデストロイする

```shell script
make destroy
```