require('dotenv/config')

import express, { json } from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()

const apiUrl = process.env.API_URL || 'http://api.example.com'
const credentials = process.env.API_TOKEN || 'token_example'
const apiName = process.env.API_NAME

const apiCrm = axios.create({
  baseURL: apiUrl,
  headers: {
    'Cache-Control': 'no-cache'
  }
})

async function getCrmToken () {
  try {
    const { data: { nmToken } } = await apiCrm.post(
      '/kernel/security/Token',
      {
        dsCredentials: credentials
      }
    )
    return nmToken
  } catch (error) {
    console.log(`Error on try request a token on ${apiName} api.`)
    console.log('Error::: ', error)
  }
}

const port = 3000

const token = 'hk290120'

const corsOptions = {
  exposedHeaders: ['Content-Type', 'Cache-Control'],
  methods: ['GET', 'POST']
}

app.use(cors(corsOptions))

app.use('*', async (req, res) => {

  // Validate allowed methods
  if (!corsOptions.methods.includes(req.method)) {
    res.sendStatus(405)
    return
  }
  
  // Validate proxy authorization token
  if(!req.headers.authorization || req.headers.authorization !== token) {
    res.sendStatus(403)
    return
  }

  // Get CRM api token
  const crmToken = await getCrmToken()
  console.log(crmToken)

  // Parse proxy parameters to request CRM Api
  const { headers, method, body, originalUrl } = req
  console.log('request params: ', { headers, originalUrl, method, body })

  try {
    const response = await apiCrm[method.toLowerCase()](
      originalUrl,
      body,
      {
        withCredentials: true,
        headers: {
          'Cookie': `crmAuthToken=${crmToken}`
        }
      }
    )
    console.log(response)
    res.send(response)
  } catch (err) {
    const error = {
      status: err.response.status,
      message: err.message
    }
    res.status(error.status).send(error)
    console.log(`Error on try request on ${apiName}: ${error.message}`)
    console.log(err)
  }

})

app.listen(port, () => {
  return console.log(`Serving ${apiName} proxy to url ${apiUrl}`)
})