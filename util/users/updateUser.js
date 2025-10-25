import mongoose from 'mongoose'
import config from '../../config/index.js'
import User from '../../src/adapters/localdb/models/users.js'

async function getUsers () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(
    config.database,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )

  // Find the user by email.
  const user = await User.findOne({
    email: 'test@test.com'
  }, '-password')

  // Update the users password
  // user.password = 'newpassword'

  // Change the user to an admin
  // user.type = 'admin'

  // Save the changes to the database.
  await user.save()

  mongoose.connection.close()
}
getUsers()
