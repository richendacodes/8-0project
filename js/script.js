var FIREBASEURL = "https://livecatalog.firebaseio.com/";
var myFirebaseRef;
var nytcategoryArray = ['hardcover-fiction','trade-fiction-paperback','e-book-fiction','mass-market-paperback',
  'hardcover-nonfiction','e-book-nonfiction','paperback-nonfiction','advice-how-to-and-miscellaneous'];
var nytBestSellingDict = {};
var loadCounter;
var isbnsCounter;

var shopApiUrl = "https://api.shop.com/sites/v1/search/term/Books/";
var fullShopApiUrl;
var fullGoogleApiUrl;
var nytTitle;
var nytAuthor;
var nytAmazonURL;
var nytImage;
var nytTitleLowerCase;
var bookTitleOnSplit;
var bookTitle;
var reviewUrl;

var theData;
var breakNotifier;
var anotherBreak;
var bookSearchItem;
var shopBookPrice;
var shopURL;

var googleBookDescription;
var googleBookImage;

var myProductHash = {};
var myGoogleHash = {};

$( document ).ready(theMainFunction);


function theMainFunction() {
  myFirebaseRef = new Firebase(FIREBASEURL);
  loadCounter = nytcategoryArray.length;

  var userName = bootbox.prompt("Welcome to LiveCatalog, please enter your name?", function(result) {
  var name = result.length;

 if (name != 0) {
      $('#hiUser').html("Hi, " + result);
      return;
    } else 
       var userAgain = bootbox.prompt("Let's try that again, please enter your name?", function(result) {
       var name = result.length;

       if (name != 0) {
            $('#hiUser').html("Hi, " + result);
            return;
          } else 
            $('#hiUser').html("Hi, party pooper");

      }  )    
  });


  $.ajax({
    url:"js/categorybooklist.json",
    dataType:"json",
    type:"GET",
    success: function(data){
      for(var i = 0; i < nytcategoryArray.length; i++){
        getBestSellersAndFillCarousel(data[nytcategoryArray[i]]);

      }
    }

  });

}


function getBestSellersAndFillCarousel(nytUrl){

  var nyTimesRef = myFirebaseRef.child("APIKEYS/nytimes").on("value", function(snapshot) {
    var key = snapshot.val();
    key = key.replace(/:/g,"%3A");
    nytUrl+="?"+"api-key="+key;

    $.ajax({
      url: nytUrl,
      dataType: "json",
      type: "GET",
      success: function (data) {

        var anchor = $('<a>');
        anchor.attr("rel","rondell");
        anchor.attr("href","#");
        var img = $('<img>');
        img.attr("src",data["results"]["books"]["0"]["book_image"]);
        anchor.val({"books":data["results"]["books"],
                    "listing":data["results"]["list_name"]});
        anchor.on("click",function(){callGetProductDetails(this,true)});
        anchor.on("click",fillBestSellersListing);

        img.addClass("resizeable");

        anchor.append(img);
        $('#rondellcarousel').append(anchor);
        if((--loadCounter) == 0){
          $('#rondellcarousel').rondell({
            preset: "carousel"
          },function(){},function(){$('#rondellcarousel').find('.rondell-item-focused').trigger("click")});

        }
      }
    });
  });
}


function callGetProductDetails(anchor,isMany){
  if(isMany)
    getProductDetails($(anchor).val()["books"]["0"]);
  else
    getProductDetails($(anchor).val());
}


function fillBestSellersListing(){
  var books = $(this).val()["books"];
  var listing = $(this).val()["listing"];
  $('#bestsellerList').find('.panel-heading').find('h4').html(listing);
  $('#bestsellerList').find('.panel-body').empty();

  for(var i = 1; i < books.length; i++){
    var div = $('<div>');
    div.addClass("bestsellerItem");
    var span = $('<span>');
    span.append(books[""+i]["title"]);
    span.addClass("bestsellerTitle");
    div.append(span);
    div.append("<br>");
    span = $('<span>');
    span.addClass("bestsellerAuthor");
    span.append(books[""+i]["author"]);
    div.append(span);
    div.val(books[""+i]);
    div.on("click",function(){callGetProductDetails(this,false)});
    $('#bestsellerList').find('.panel-body').append(div);

  }
}


function getProductDetails(data){

  theData = data;
  breakNotifier = false;
  anotherBreak = false;
  nytTitle = theData.title;
  nytAuthor = theData.contributor;
  nytAmazonURL = theData.amazon_product_url;
  nytImage = theData.book_image;
  reviewUrl = theData.book_review_link;

  nytTitleLowerCase = nytTitle.toLowerCase();
  bookTitleOnSplit = nytTitleLowerCase.split(' ');
  bookTitle = bookTitleOnSplit.join("+");

  fullShopApiUrl = shopApiUrl+bookTitle;


  if(myProductHash[fullShopApiUrl] === undefined){
    $.ajax({
      url: fullShopApiUrl,
      dataType: "json",
      type: "GET",
      success: findProductInShop

    });
  }else{
    findProductInShopHandler(myProductHash[fullShopApiUrl]);
  }

}


function findProductInShop(data){

  myProductHash[fullShopApiUrl] = data;
  findProductInShopHandler(myProductHash[fullShopApiUrl]);
}


function findProductInShopHandler(data){
  fullGoogleApiUrl = "https://www.googleapis.com/books/v1/volumes?q="+nytTitle+"+inauthor:"+theData.author+"&key=AIzaSyBs2Kqqt1HgWffErU0e9XIQhj-CjYEswGM";

  for(var i = 0; i < theData.isbns.length; i++) {
    for(var j = 0; j < data.searchItems.length; j++){

      if((theData.isbns[i].isbn13 === data.searchItems[j].prods_CatalogSKU) || (theData.isbns[i].isbn13 === data.searchItems[j].manufacturerPartNumber)){
        breakNotifier = true;
        bookSearchItem = data.searchItems[j];
        shopBookPrice = data.searchItems[j].priceInfo.price;
        shopURL = data.searchItems[j].modelQuickViewDetails.linkUrl;
        break;
      }
    }

    if(breakNotifier == true){
      break;
    }
  }

  if(myGoogleHash[fullGoogleApiUrl] === undefined) {
    fullGoogleApiUrl = fullGoogleApiUrl.replace(/ /g,"%20");
    $.ajax({
      url: fullGoogleApiUrl,
      dataType: "json",
      type: "GET",
      success: findBookInfoInGoogleBooks

    });
  }else{
    findBookInfoInGoogleBooksHandler(myGoogleHash[fullGoogleApiUrl]);
  }
}


function findBookInfoInGoogleBooksHandler(data){

  for(var i = 0; data.items!==undefined && i < data.items.length; i++){

    if(googleBookDescription !== undefined){

      for(var j = 0; j < theData.isbns.length; j++){

        if(data.items[i].volumeInfo.industryIdentifiers === undefined){
          continue;
        }if(data.items[i].volumeInfo.industryIdentifiers[0].type === "ISBN_13"){
          if(theData.isbns[j].isbn13 === data.items[i].volumeInfo.industryIdentifiers[0].identifier || theData.primary_isbn13 === data.items[i].volumeInfo.industryIdentifiers[0].identifier){
            googleBookDescription = data.items[i].volumeInfo.description;
            googleBookImage = data.items[i].volumeInfo.imageLinks.thumbnail;
            anotherBreak = true;
            break;
          }
        }else if(data.items[i].volumeInfo.industryIdentifiers[1].type === "ISBN_13"){
          if(theData.isbns[j].isbn13 === data.items[i].volumeInfo.industryIdentifiers[1].identifier || theData.primary_isbn13 === data.items[i].volumeInfo.industryIdentifiers[0].identifier){

            googleBookDescription = data.items[i].volumeInfo.description;
            googleBookImage = data.items[i].volumeInfo.imageLinks.thumbnail;
            anotherBreak = true;
            break;
          }
        }
      }

      if(anotherBreak === true){
        anotherBreak = true;
        break;
      }else if(nytTitleLowerCase === data.items[i].volumeInfo.title.toLowerCase()){
        googleBookDescription = data.items[i].volumeInfo.description;
        googleBookImage = data.items[i].volumeInfo.imageLinks.thumbnail;
        anotherBreak = true;
        break;
      }
    }
  }

  if(anotherBreak){
    displayContent();
  }
  else{

    var isbns;

    if(theData.isbns.length !== 0){
      isbns = theData.isbns;
    }
    else{
      isbns = [{"isbn10":theData.primary_isbn10,"isbn13":theData.primary_isbn13}];
    }
    isbnsCounter = isbns.length;

    for(var i = 0; i < isbns.length; i++){
      fullGoogleApiUrl = "https://www.googleapis.com/books/v1/volumes?q="+nytTitle+"+isbn:"+isbns[i+""].isbn13;
      $.ajax({
        url: fullGoogleApiUrl,
        type:"GET",
        dataType:"json",
        success: function(dataP){

          if(dataP.items === undefined){
            return;
          }

          if(anotherBreak){
            return;
          }

          if(dataP.items.length >= 1){
            googleBookDescription = dataP.items[0].volumeInfo.description;
            if(dataP.items[0].volumeInfo.imageLinks !== undefined){
              googleBookImage = dataP.items[0].volumeInfo.imageLinks.thumbnail;
            }
            else{
              googleBookImage = nytImage;
            }

            anotherBreak = true;
            displayContent();
          }
          else{
            isbnsCounter--;
            if(isbnsCounter === 0){
              displayContent();
            }
          }

        }
      })

    }

  }


}


function findBookInfoInGoogleBooks(data){
  myGoogleHash[fullGoogleApiUrl] = data;
  findBookInfoInGoogleBooksHandler(myGoogleHash[fullGoogleApiUrl]);

}


function displayContent(){

  if(breakNotifier === false && anotherBreak === false){
    var img = $('<img>').attr("src", nytImage).addClass("resize").addClass("centerimage");

    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text("No description available at this time...");

    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").hide();
    $("#bookInfoPanel").find(".row").find(".bookShopLink").children("a").hide();
    $("#bookInfoPanel").find(".row").find(".bookAmazonLink").children("a").attr("href", nytAmazonURL).attr("target", "_blank");

    if(reviewUrl.length !== 0){
      var anchor = $('#reviewRow').find("a");

      if(anchor !== undefined || anchor !== null){
        $(anchor).remove();
      }

      anchor = $('<a>');
      anchor.attr("href",reviewUrl);
      anchor.attr("target","_blank");
      anchor.append(reviewUrl);

      $('#reviewRow').find('.col-md-12').append(anchor);
      $('#reviewRow').show();
    }
    else{
      $('#reviewRow').hide();
    }
  }else if(breakNotifier === true && anotherBreak === false){

    var img = $('<img>').attr("src", nytImage).addClass("resize").addClass("centerimage");

    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text(theData.description);

    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").show().text(shopBookPrice);
    $("#bookInfoPanel").find(".row").find(".bookShopLink").children("a").show().attr("href", shopURL).attr("target", "_blank");
    $("#bookInfoPanel").find(".row").find(".bookAmazonLink").children("a").attr("href", nytAmazonURL).attr("target", "_blank");

    if(reviewUrl.length !== 0){
      var anchor = $('#reviewRow').find("a");

      if(anchor !== undefined || anchor !== null){
        $(anchor).remove();
      }

      anchor = $('<a>');
      anchor.attr("href",reviewUrl);
      anchor.attr("target","_blank");
      anchor.append(reviewUrl);

      $('#reviewRow').find('.col-md-12').append(anchor);
      $('#reviewRow').show();
    }
    else{
      $('#reviewRow').hide();
    }
  }else{

    var img = $('<img>').attr("src", googleBookImage).addClass("resize").addClass("centerimage");

    $("#bookInfoPanel").find(".bookImg").empty();
    $("#bookInfoPanel").find(".bookImg").append(img);

    $("#bookInfoPanel").find(".row").find(".col-md-6").children().empty();
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("h4").text(nytTitle);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#author").text(nytAuthor);
    $("#bookInfoPanel").find(".row").find(".col-md-6").children("#description").text(googleBookDescription);

    $("#bookInfoPanel").find(".row").find(".bookPrice").children("H5").hide();
    $("#bookInfoPanel").find(".row").find(".bookShopLink").children("a").hide();
    $("#bookInfoPanel").find(".row").find(".bookAmazonLink").children("a").attr("href", nytAmazonURL).attr("target", "_blank");

    if(reviewUrl.length !== 0){
      var anchor = $('#reviewRow').find("a");

      if(anchor !== undefined || anchor !== null){
        $(anchor).remove();
      }

      anchor = $('<a>');
      anchor.attr("href",reviewUrl);
      anchor.attr("target","_blank");
      anchor.append(reviewUrl);

      $('#reviewRow').find('.col-md-12').append(anchor);
      $('#reviewRow').show();
    }
    else{
      $('#reviewRow').hide();
    }
  }

  breakNotifier = false;
  anotherBreak = false;
}