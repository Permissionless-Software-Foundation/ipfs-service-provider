/*
  Utility functions used to prepare the environment for tests.
*/

// Public NPM libraries
import mongoose from 'mongoose'
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'
import JsonFiles from '../../src/adapters/json-files.js'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'

const jsonFiles = new JsonFiles()

const LOCALHOST = `http://localhost:${config.port}`
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Remove all collections from the DB.
async function cleanDb () {
  for (const collection in mongoose.connection.collections) {
    const collections = mongoose.connection.collections
    if (collections.collection) {
      // const thisCollection = mongoose.connection.collections[collection]
      // console.log(`thisCollection: ${JSON.stringify(thisCollection, null, 2)}`)

      await collection.deleteMany()
    }
  }
}

// This function is used to create new users.
// userObj = {
//   username,
//   password
// }
async function createUser (userObj) {
  try {
    const options = {
      method: 'POST',
      url: `${LOCALHOST}/users`,
      data: {
        user: {
          email: userObj.email,
          password: userObj.password,
          name: userObj.name
        }
      }
    }

    const result = await axios(options)

    const retObj = {
      user: result.data.user,
      token: result.data.token
    }

    return retObj
  } catch (err) {
    console.log(
      'Error in utils.js/createUser(): ' + JSON.stringify(err, null, 2)
    )
    throw err
  }
}

async function loginTestUser () {
  try {
    const options = {
      method: 'POST',
      url: `${LOCALHOST}/auth`,
      data: {
        email: 'test@test.com',
        password: 'pass'
      }
    }

    const result = await axios(options)

    // console.log(`result: ${JSON.stringify(result.data, null, 2)}`)

    const retObj = {
      token: result.data.token,
      user: result.data.user.username,
      id: result.data.user._id.toString()
    }

    return retObj
  } catch (err) {
    console.log(
      'Error authenticating test user: ' + JSON.stringify(err, null, 2)
    )
    throw err
  }
}

async function loginAdminUser () {
  try {
    const FILENAME = `${__dirname.toString()}../../config/system-user-${config.env}.json`
    // console.log('FILENAME: ', FILENAME)

    const adminUserData = await jsonFiles.readJSON(FILENAME)
    // console.log(`adminUserData: ${JSON.stringify(adminUserData, null, 2)}`)

    const options = {
      method: 'POST',
      url: `${LOCALHOST}/auth`,
      data: {
        email: adminUserData.email,
        password: adminUserData.password,
        name: 'admin'
      }
    }

    const result = await axios(options)

    // console.log(`result: ${JSON.stringify(result.data, null, 2)}`)

    const retObj = {
      token: result.data.token,
      user: result.data.user.username,
      id: result.data.user._id.toString()
    }

    return retObj
  } catch (err) {
    console.log(
      'Error authenticating test admin user: ' + JSON.stringify(err, null, 2)
    )
    throw err
  }
}

// Retrieve the admin user JWT token from the JSON file it's saved at.
async function getAdminJWT () {
  try {
    // process.env.KOA_ENV = process.env.KOA_ENV || 'dev'
    // console.log(`env: ${process.env.KOA_ENV}`)

    const FILENAME = `${__dirname.toString()}../../config/system-user-${config.env}.json`
    // console.log('FILENAME: ', FILENAME)
    const adminUserData = await jsonFiles.readJSON(FILENAME)
    // console.log(`adminUserData: ${JSON.stringify(adminUserData, null, 2)}`)

    return adminUserData.token
  } catch (err) {
    console.error('Error in test/utils.js/getAdminJWT()')
    throw err
  }
}
// Fetches all users from the database.
async function getAllUsers () {
  try {
    const adminJWT = await getAdminJWT()
    const options = {
      method: 'GET',
      url: `${LOCALHOST}/users`,
      headers: {
        Authorization: `Bearer ${adminJWT}`
      }
    }
    const result = await axios(options)
    return result.data.users
  } catch (err) {
    console.error('Error in test/utils.js/getAllUsers()', err)
    throw err
  }
}

// Deletes all users from the database.
async function deleteAllUsers () {
  try {
    const allUsers = await getAllUsers()
    const adminJWT = await getAdminJWT()
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i]
      // Skip the admin user.
      if (user.type === 'admin') {
        continue
      }
      const options = {
        method: 'DELETE',
        url: `${LOCALHOST}/users/${user._id}`,
        headers: {
          Authorization: `Bearer ${adminJWT}`
        }
      }
      await axios(options)
    }
  } catch (err) {
    console.error('Error in test/utils.js/deleteAllUsers()', err)
    throw err
  }
}
export default {
  cleanDb,
  createUser,
  loginTestUser,
  loginAdminUser,
  getAdminJWT,
  deleteAllUsers,
  getAllUsers
}
