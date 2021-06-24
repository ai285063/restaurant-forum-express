'use strict'
const db = require('../models')
const Restaurant = db.Restaurant
const User = db.User

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const firstRest = await Restaurant.findAll({
        raw: true,
        limit: 3,
        order: [['id', 'ASC']]
      })
      const existUsers = await User.findAll({
        raw: true,
        attributes: ['id']
      })

      await queryInterface.bulkInsert('Comments',
        ['Good', 'Nah doesn\'t worth the price', 'Very Tasty', 'Will recommend friends!', 'Horrible', 'Never gonna come back', 'There\'s something in the food', 'Decent place!']
          .map((item, index, startDate, endDate) => ({
            id: index * 10 + 1,
            text: item,
            UserId: existUsers[Math.floor(Math.random() * existUsers.length)].id,
            RestaurantId: firstRest[Math.floor(Math.random() * firstRest.length)].id,
            createdAt: randomDate(new Date(2021, 0, 1), new Date(2021, 1, 28)),
            updatedAt: randomDate(new Date(2021, 2, 1), new Date())
          })
          ), {})
    } catch (err) {
      console.log(`Error: ${err}`)
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
}

function randomDate (start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}
