const path = require("path");

module.exports = {
  name: "React-webpack-setting", // 웹팩 설정 이름
  mode: "development", //실서비스 : Production
  devtool: "eval",
  resolve: {
    extensions: [".js", ".jsx"],
  },
  entry: {
    // 합쳐질 파일 요소들 입력
    app: path.resolve(__dirname, "app", "index.jsx"),
  },
  module: {
    //모듈 연결 설정
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  output: {
    // 최종적으로 만들어질 js
    path: path.join(__dirname, "dist", "app"), //빌드 위치
    filename: "bundle.js", //웹팩 빌드 후 최종적으로 만들어질 파일
  },
};
