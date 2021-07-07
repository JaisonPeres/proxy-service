require('dotenv/config')

import express, { json } from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()
const port = process.env.PORT || 3000

// Configure settings of final API with .env file
const apiUrl = process.env.API_URL || 'http://api.example.com'
const credentials = process.env.API_TOKEN || 'token_example'
const apiName = process.env.API_NAME || 'API_EXAMPLE'
const apiAuthPath = process.env.API_AUTH_PATH || '/path/to/auth'
const proxyToken = process.env.PROXY_TOKEN || '123456'


// Instance of axios with API_URL
const finalApi = axios.create({
  baseURL: apiUrl,
  headers: {
    'Cache-Control': 'no-cache'
  }
})

// Authenticate proxy service on final api
async function authProxyOnApi (res) {
  try {
    const { data: { nmToken } } = await finalApi.post(
      apiAuthPath,
      {
        dsCredentials: credentials
      }
    )
    if (!nmToken) {
      res.status(401).send('Token not found')
      return
    }
    return nmToken
  } catch (err) {
    const error = {
      status: err.response.status,
      message: `Validate credential error (${err.message})`
    }
    res.status(error.status).send(error)
    console.log(err)
  }
}

// Set CORS options
const corsOptions = {
  exposedHeaders: ['Content-Type', 'Cache-Control'],
  // Inclute more methods to allow
  methods: ['GET', 'POST']
}

app.use(cors(corsOptions))

app.use('*', async (req, res) => {

  // Validate allowed methods
  if (!corsOptions.methods.includes(req.method)) {
    res.sendStatus(405)
    return
  }
  
  // Validate proxy service token
  if(!req.headers.authorization || req.headers.authorization !== proxyToken) {
    res.sendStatus(403)
    return
  }

  // Get token from final api authentication
  const finalToken = await authProxyOnApi(res)

  // Parse proxy parameters to request final api
  const { headers, method, body, originalUrl } = req

  // Execute request on final api
  // TODO: improve authentication header options
  try {
    const response = await finalApi[method.toLowerCase()](
      originalUrl,
      body,
      {
        headers: {
          ...headers,
          'Cookie': `crmAuthToken=${finalToken}`
        }
      }
    )
    res.send(response)
  } catch (err) {
    const error = {
      status: err.response.status,
      message: `Request error (${err.message})`
    }
    res.status(error.status).send(error)
    console.log(err)
  }

})

app.listen(port, () => {
  return console.log(`Serving ${apiName} proxy to url ${apiUrl}`)
})