# ベースイメージ
FROM node:25-slim

# 作業ディレクトリ
WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係インストール
RUN npm install

# ソースコードコピー
COPY . .

# Vite 開発サーバー起動
CMD [ "npm", "run", "dev" ]
