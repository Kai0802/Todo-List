const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

// const items = ["By Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// creating the item schema

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  items: [itemSchema],
});

// creating the item model -> mongoose will automatically
// create a new collection named items inside of todolistDB
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

// establish connection to database
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const defaItem1 = new Item({
  name: "Welcome to your todolist",
});

const defaItem2 = new Item({
  name: "Hit the + button to add a new item",
});

const defaItem3 = new Item({
  name: "<-- Hit this check box to delete an item",
});
const defaultItems = [defaItem1, defaItem2, defaItem3];
const addingDefaultItems = async function () {
  await Item.insertMany(defaultItems);
  console.log("Successfully added items");
};

const getItems = async function () {
  const items = await Item.find({}).exec();
  const itemsName = [];
  if (items.length === 0) {
    await addingDefaultItems();
  } else {
    items.forEach(function (item) {
      itemsName.push(item);
    });
  }

  return itemsName;
};
const addItems = function (req, res) {
  const newItem = Item({
    name: req.body.newItem,
  });
  newItem.save();
};

// const deleteItems = async function () {};
app.get("/", function (req, res) {
  const itemList = getItems();

  // const day = date.getDate();
  itemList.then(function (myItems) {
    res.render("list", { listTitle: "Today", newlistItems: myItems });
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  console.log(listName);

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (model) {
        console.log(listName);
        console.log(model);
        model.items.push(item);
        model.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
  console.log(req.body.list);
});

app.post("/delete", async (req, res) => {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(checkedId);
  console.log(listName);
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedId)
      .then(function (doc) {
        console.log("Successfully delete item with id " + checkedId);
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    const query = { name: listName };
    const updateQuery = { $pull: { items: { _id: checkedId } } };
    List.findOneAndUpdate(query, updateQuery)
      .then(function (doc) {
        console.log(doc);
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/:customListName", function (req, res) {
  // console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
    .then(function (model) {
      if (model) {
        console.log(
          "List under the name " + customListName + " already existed"
        );
        res.render("list", {
          listTitle: model.name,
          newlistItems: model.items,
        });
      } else {
        console.log("creating a list name: " + customListName);
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/about", function (req, res) {
  res.render("about");
});

app.listen(5000, function () {
  console.log("server started on port 5000");
});
