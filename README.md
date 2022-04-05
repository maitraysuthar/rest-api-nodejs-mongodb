[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-white.svg)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)


[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=aliartiza75_rest-api-nodejs-mongodb)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=aliartiza75_rest-api-nodejs-mongodb&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=aliartiza75_rest-api-nodejs-mongodb)



# Nodejs Expressjs MongoDB Ready-to-use API Project Structure
[![Author](http://img.shields.io/badge/author-@maitraysuthar-blue.svg)](https://www.linkedin.com/in/maitray-suthar/) [![GitHub license](https://img.shields.io/github/license/maitraysuthar/rest-api-nodejs-mongodb.svg)](https://github.com/maitraysuthar/rest-api-nodejs-mongodb/blob/master/LICENSE)  ![GitHub repo size](https://img.shields.io/github/repo-size/maitraysuthar/rest-api-nodejs-mongodb) [![Codacy Badge](https://api.codacy.com/project/badge/Coverage/b3eb80984adc4671988ffb22d6ad83df)](https://www.codacy.com/manual/maitraysuthar/rest-api-nodejs-mongodb?utm_source=github.com&utm_medium=referral&utm_content=maitraysuthar/rest-api-nodejs-mongodb&utm_campaign=Badge_Coverage) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/b3eb80984adc4671988ffb22d6ad83df)](https://www.codacy.com/manual/maitraysuthar/rest-api-nodejs-mongodb?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=maitraysuthar/rest-api-nodejs-mongodb&amp;utm_campaign=Badge_Grade) ![Travis (.com)](https://img.shields.io/travis/com/maitraysuthar/rest-api-nodejs-mongodb)

A ready-to-use boilerplate for REST API Development with Node.js, Express, and MongoDB


## Getting started


This is a basic API skeleton written in JavaScript ES2015. Very useful to building a RESTful web APIs for your front-end platforms like Android, iOS or JavaScript frameworks (Angular, Reactjs, etc).

This project will run on **NodeJs** using **MongoDB** as database. I had tried to maintain the code structure easy as any beginner can also adopt the flow and start building an API. Project is open for suggestions, Bug reports and pull requests.

## Some Great Stuff

<a href="https://tracking.gitads.io/?campaign=gitads&repo=rest-api-nodejs-mongodb&redirect=gitads.io" target="_blank"><img src="https://images.gitads.io/rest-api-nodejs-mongodb" alt="Some Great Stuff" style="height: auto !important;width: auto !important;" ></a>
<br><i>This advert was placed by <a href="https://tracking.gitads.io/?campaign=gitads&repo=rest-api-nodejs-mongodb&redirect=gitads.io" rel="gitads">GitAds</a> </i>

## Advertise for Job/Work Contract

I am looking for a good job or work contract. You can contact me directly on my email ([maitraysuthar@gmail.com](mailto:maitraysuthar@gmail.com "maitraysuthar@gmail.com")) or you can download my CV from my personal  [website](https://maitraysuthar.github.io/portfolio/). Looking forward. Thanks :smile:

## Buy me a Coffee

If you consider my project as helpful stuff, You can appreciate me or my hard work and time spent to create this helpful structure with buying a coffee for me. I would be very thankful if you buy me a coffee, please buy me a coffee :smile:.

<a href="https://www.buymeacoffee.com/36GgOoQ2f" target="_blank"><img src="https://bmc-cdn.nyc3.digitaloceanspaces.com/BMC-button-images/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## Features

-   Basic Authentication (Register/Login with hashed password)
-   Account confirmation with 4 (Changeable) digit OTP.
-   Email helper ready just import and use.
-   JWT Tokens, make requests with a token after login with `Authorization` header with value `Bearer yourToken` where `yourToken` will be returned in Login response.
-   Pre-defined response structures with proper status codes.
-   Included CORS.
-    **Book** example with **CRUD** operations.
-   Validations added.
-   Included API collection for Postman.
-   Light-weight project.
-   Test cases with [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/).
-   Code coverage with [Istanbuljs (nyc)](https://istanbul.js.org/).
-   Included CI (Continuous Integration) with [Travis CI](https://travis-ci.org).
-   Linting with [Eslint](https://eslint.org/).

## Software Requirements

-   Node.js **8+**
-   MongoDB **3.6+** (Recommended **4+**)

## How to install

### Using Git (recommended)

1.  Clone the project from github. Change "myproject" to your project name.

```bash
git clone https://github.com/maitraysuthar/rest-api-nodejs-mongodb.git ./myproject
```

### Using manual download ZIP

1.  Download repository
2.  Uncompress to your desired directory

### Install npm dependencies after installing (Git or manual download)

```bash
cd myproject
npm install
```

### Setting up environments

1.  You will find a file named `.env.example` on root directory of project.
2.  Create a new file by copying and pasting the file and then renaming it to just `.env`
    ```bash
    cp .env.example .env
    ```
3.  The file `.env` is already ignored, so you never commit your credentials.
4.  Change the values of the file to your environment. Helpful comments added to `.env.example` file to understand the constants.
## Project  structure
```sh
.
├── app.js
├── package.json
├── bin
│   └── www
├── controllers
│   ├── AuthController.js
│   └── BookController.js
├── models
│   ├── BookModel.js
│   └── UserModel.js
├── routes
│   ├── api.js
│   ├── auth.js
│   └── book.js
├── middlewares
│   ├── jwt.js
├── helpers
│   ├── apiResponse.js
│   ├── constants.js
│   ├── mailer.js
│   └── utility.js
├── test
│   ├── testConfig.js
│   ├── auth.js
│   └── book.js
└── public
    ├── index.html
    └── stylesheets
        └── style.css
```
## How to run

### Running API server locally

```bash
npm run dev
```

You will know server is running by checking the output of the command `npm run dev`

```bash
Connected to mongodb:YOUR_DB_CONNECTION_STRING
App is running ...

Press CTRL + C to stop the process.
```
**Note:**  `YOUR_DB_CONNECTION_STRING` will be your MongoDB connection string.

## Running as Docker container

1.  Build its image:

```bash
sudo docker build -t rest-api-nodejs-mongodb:0.0.1 -f build/package/Dockerfile .
```

2.  Run it as a container:

```bash
sudo docker run -it -e MONGODB_URL=mongodb://127.0.0.1:27017/rest-api-nodejs-mongodb -e JWT_SECRET=abc1235 -e JWT_TIMEOUT_DURATION="2 hours"  --net host api:0.0.1
```

### Creating new models

If you need to add more models to the project just create a new file in `/models/` and use them in the controllers.

### Creating new routes

If you need to add more routes to the project just create a new file in `/routes/` and add it in `/routes/api.js` it will be loaded dynamically.

### Creating new controllers

If you need to add more controllers to the project just create a new file in `/controllers/` and use them in the routes.

## Tests

### Running  Test Cases

```bash
npm test
```

You can set custom command for test at `package.json` file inside `scripts` property. You can also change timeout for each assertion with `--timeout` parameter of mocha command.

### Creating new tests

If you need to add more test cases to the project just create a new file in `/test/` and run the command.

## ESLint

### Running  Eslint

```bash
npm run lint
```

You can set custom rules for eslint in `.eslintrc.json` file, Added at project root.

## Bugs or improvements

Every project needs improvements, Feel free to report any bugs or improvements. Pull requests are always welcome.

## License

This project is open-sourced software licensed under the MIT License. See the LICENSE file for more information.
