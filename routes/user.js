var express = require("express");
const UserController = require("../controllers/UserController");

var router = express.Router();

router.get("/", UserController.userList);
router.post("/", UserController.userStore);
router.put("/:id", UserController.userUpdate);
router.delete("/:id", UserController.userDelete);

module.exports = router;