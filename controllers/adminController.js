const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant
const User = db.User

const adminService = require('../services/adminService.js')

const imgur = require('imgur-node-api')
const { useFakeServer } = require('sinon')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const adminController = {
  getRestaurants: (req, res) => {
    adminService.getRestaurants(req, res, (data) => {
      return res.render('admin/restaurants', data)
    })
  },
  createRestaurant: (req, res) => {
    Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      return res.render('admin/create', {
        categories: categories
      })
    })
  },
  postRestaurant: (req, res) => {
    adminService.postRestaurant(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      res.redirect('/admin/restaurants')
    })
  },
  getRestaurant: (req, res) => {
    adminService.getRestaurant(req, res, (data) => {
      console.log(data)
      return res.render('admin/restaurant', data)
    })
  },
  editRestaurant: (req, res) => {
    Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      return Restaurant.findByPk(req.params.id).then(restaurant => {
        return res.render('admin/create', {
          categories: categories,
          restaurant: restaurant.toJSON()
        })
      })
    })
  },
  putRestaurant: (req, res) => {
    adminService.putRestaurant(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      res.redirect('/admin/restaurants')
    })
  },
  deleteRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id)
      .then((restaurant) => {
        restaurant.destroy()
          .then((restaurant) => {
            res.redirect('/admin/restaurants')
          })
      })
  },
  getUsers: (req, res) => {
    return User.findAll({ raw: true })
      .then(users => {
        res.render('admin/users', { users: users })
      })
      .catch(() => {
        res.status(404).send('Something broke!')
      })
  },
  toggleAdmin: (req, res) => {
    // 覺得應該要設一個擋下更改自己權限的機制但這樣測試檔的條件不會過
    // const userId = req.user.id.toString()
    // if (userId === req.params.id) {
    //   req.flash('error_messages', 'You are not allowed to change your own identity.')
    //   return res.redirect('/admin/users')
    // }

    return User.findByPk(req.params.id)
      .then((user) => {
        return user.update({ isAdmin: user.isAdmin ? 0 : 1 })
      })
      .then((user) => {
        req.flash('success_messages', `Successfully changed ${user.name}'s identity.`)
        return res.redirect('/admin/users')
      })
      .catch((err) => {
        req.flash('error_messages', `Error occurred: ${err}`)
        return res.redirect('/admin/users')
      })
  }
}

module.exports = adminController
