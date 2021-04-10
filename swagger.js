const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./routes/api.js']

swaggerAutogen(outputFile, endpointsFiles)