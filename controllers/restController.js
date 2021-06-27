const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User
const helpers = require('../_helpers')
const Sequelize = require('sequelize')

const pageLimit = 10

const restController = {
  getRestaurants: (req, res) => {
    let offset = 0
    const whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.categoryId = categoryId
    }
    Restaurant.findAndCountAll({
      include: Category,
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    }).then(result => {
      const page = Number(req.query.page) || 1
      const pages = Math.ceil(result.count / pageLimit)
      const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
      const prev = page - 1 < 1 ? 1 : page - 1
      const next = page + 1 > pages ? pages : page + 1
      const data = result.rows.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 50),
        categoryName: r.dataValues.Category.name,
        isFavorited: helpers.getUser(req).FavoritedRestaurants.map(d => d.id).includes(r.id),
        isLiked: helpers.getUser(req).LikedRestaurants.map(d => d.id).includes(r.id)
      }))
      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        return res.render('restaurants', {
          restaurants: data,
          categories: categories,
          categoryId: categoryId,
          page: page,
          totalPage: totalPage,
          prev: prev,
          next: next
        })
      })
    })
  },
  getRestaurant: async (req, res) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id, {
        include: [
          Category,
          { model: User, as: 'FavoritedUsers' },
          { model: User, as: 'LikedUsers' },
          { model: Comment, include: [User] }
        ]
      })
      await restaurant.increment({ viewCounts: 1 })
      const isFavorited = await restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
      const isLiked = await restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)
      return res.render('restaurant', {
        restaurant: restaurant.toJSON(),
        isFavorited: isFavorited,
        isLiked: isLiked
      })
    } catch (err) {
      console.log(`Error: ${err}`)
    }
  },
  getFeeds: (req, res) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [Category]
      }),
      Comment.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      })
    ]).then(([restaurants, comments]) => {
      return res.render('feeds', {
        restaurants: restaurants,
        comments: comments
      })
    })
  },
  getDashboard: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {
      return res.render('dashboard', { restaurant: restaurant.toJSON() })
    })
  },
  getTop10: async (req, res) => {
    // try {
    //   const data = await Restaurant.findAll({
    //     group: ['id'],
    //     includeIgnoreAttributes: false,
    //     include: [
    //       {
    //         model: User,
    //         as: 'FavoritedUsers',
    //         duplicating: false
    //       }
    //     ],
    //     limit: 10,
    //     attributes: [
    //       'id', 'name', 'description', 'image',
    // 這行 Sequelize.fn 這樣寫的話會讓沒有人收藏的餐廳明明是 FavoritedUsers:[]，但會被算成 FavoritedCount 有 1 因為有 1 個 array
    //       [Sequelize.fn('COUNT', 'FavoritedUsers'), 'FavoritedCount']
    //     ],
    //     order: [[Sequelize.literal('FavoritedCount'), 'DESC'], ['id']]
    //   })
    //   const top10Rest = data.map(restaurant => ({
    //     ...restaurant.dataValues,
    //     isFavorited: helpers.getUser(req).FavoritedUsers.map(d => d.id).includes(restaurant.id)
    //   }))
    //     return res.render('top10Rest', { restaurants: top10Rest })
    // } catch (error) {
    //   req.flash('error_messages', error.toString())
    //   return res.redirect('back')
    // }

    return Restaurant.findAll({
      include: [
        {
          model: User,
          as: 'FavoritedUsers'
        }
      ]
    }).then(restaurants => {
      restaurants = restaurants.map(restaurant => ({
        ...restaurant.dataValues,
        FavoritedCount: restaurant.FavoritedUsers.length,
        isFavorited: restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
      }))
      restaurants.sort((a, b) => b.FavoritedCount - a.FavoritedCount)
      restaurants = restaurants.slice(0, 10)

      return res.render('top10Rest', {
        restaurants: restaurants
      })
    })
  }
}

module.exports = restController
