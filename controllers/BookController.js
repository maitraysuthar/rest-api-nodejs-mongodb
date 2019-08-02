const Book = require("../models/BookModel");
const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const apiResponse = require('../helpers/apiResponse');
const auth = require('../middlewares/jwt');
var moment = require('moment');
var mongoose = require('mongoose');

function BookData(data) {
    this.title= data.title;
    this.description = data.description;
    this.isbn = data.isbn;
    this.createdAt = data.createdAt;
}

/**
 * Book List.
 * 
 * @returns {Object}
 */
exports.bookList = [
    auth,
    function (req, res) {
        try {
            Book.find({user: req.user._id},'title description isbn createdAt').then((books)=>{
                if(books.length > 0){
                    return apiResponse.successResponseWithData(res, 'Operation success', books);
                }else{
                    return apiResponse.successResponseWithData(res, "Operation success", {});
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/**
 * Book Detail.
 * 
 * @returns {Object}
 */
exports.bookDetail = [
    auth,
    function (req, res) {
        if(!mongoose.Types.ObjectId.isValid(req.params.id)){
            return apiResponse.successResponseWithData(res, "Operation success", {});
        }
        try {
            Book.findOne({_id: req.params.id,user: req.user._id},'title description isbn createdAt').then((book)=>{                
                if(book !== null){
                    let bookData = new BookData(book);
                    return apiResponse.successResponseWithData(res, 'Operation success', bookData);
                }else{
                    return apiResponse.successResponseWithData(res, "Operation success", {});
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/**
 * Store book.
 * 
 * @param {string}      title 
 * @param {string}      description
 * @param {string}      isbn
 * 
 * @returns {Object}
 */
exports.bookStore = [
    auth,
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('description', 'Description must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim().custom(value => {
        return Book.findOne({isbn : value,user: req.user._id}).then(book => {
          if (book) {
            return Promise.reject('Book already exist with this ISBN no.');
          }
        });
      }),
    sanitizeBody('*').escape(),
    (req, res, next) => {
        try {
            const errors = validationResult(req);
            var book = new Book(
            { title: req.body.title,
                user: req.user,
                description: req.body.description,
                isbn: req.body.isbn
            });

            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, 'Validation Error.', errors.array());
            }
            else {
                //Save book.
                book.save(function (err) {
                    if (err) { return apiResponse.ErrorResponse(res, err); }
                    let bookData = new BookData(book);
                    return apiResponse.successResponseWithData(res,'Book add Success.', bookData);
                });
            }
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

/**
 * Store book.
 * 
 * @param {string}      title 
 * @param {string}      description
 * @param {string}      isbn
 * 
 * @returns {Object}
 */
exports.bookUpdate = [
    auth,
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('description', 'Description must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),
    sanitizeBody('*').escape(),
    (req, res, next) => {
        try {
            const errors = validationResult(req);
            var book = new Book(
            { title: req.body.title,
                description: req.body.description,
                isbn: req.body.isbn,
                _id:req.params.id
            });

            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, 'Validation Error.', errors.array());
            }
            else {
                if(!mongoose.Types.ObjectId.isValid(req.params.id)){
                    return apiResponse.validationErrorWithData(res, 'Invalid Error.', "Invalid ID");
                }
                Book.findOne({isbn : req.body.isbn,user: req.user._id, _id: { "$ne": req.params.id }}).then(book => {
                  if (book) {
                    return apiResponse.validationErrorWithData(res, 'Validation Error.', "Book already exist with this ISBN no.");
                  }
                });
                //Check authorized user
                Book.findById(req.params.id, function (err, book) {
                    if(book.user.toString() !== req.user._id){
                        return apiResponse.unauthorizedResponse(res, 'You are not authorized to do this operation.');
                    }
                });
                //Save book.
                Book.findByIdAndUpdate(req.params.id, book, {},function (err) {
                    if (err) { return apiResponse.ErrorResponse(res, err); }
                    let bookData = new BookData(book);
                    return apiResponse.successResponseWithData(res,'Book update Success.', bookData);
                });
            }
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
];