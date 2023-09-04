
const express = require("express");
const bodyParser = require("body-parser");
const dotenv=require('dotenv');
const mongoose=require("mongoose");
const _ = require("lodash");

const app = express();
dotenv.config();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery",true);
mongoose.connect(process.env.MONGO_URL);

const itemsSchema = new mongoose.Schema({
  name:String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name:"Welcome to your Task Tracker"
});

const item2 = new Item({
  name:"Hit the + button to add a task"
});

const item3 = new Item({
  name:"<-- Click here to delete an item"
});

const defaltItems=[item1,item2,item3];

const ListSchema={
  name:String,
  items:[itemsSchema]
}

const List = mongoose.model("List",ListSchema);

app.get("/", function(req, res){

  Item.find({},function(err,item){
    if(item.length===0){
      Item.insertMany(defaltItems,function(err){
        if(err)console.log(err);
      });
    }
    res.render("list", {listTitle: "Today", newListItems: item});
  })



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  })
  if(listName=="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName=="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      // if(!err)console.log("Successfully deleted");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
      if(!err)res.redirect("/"+listName);
    })
  }
})

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name:customListName,
          items:defaltItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
})


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
