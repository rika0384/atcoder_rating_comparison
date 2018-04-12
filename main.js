var user =[];

var rate = [];
var count;
var histories = [];
var tableJQ = $('#rate');
var tweetplace = $('#tweetbutton');
var firstQuery = true;

function getData(){
    count = 0;
    user.length = 0;
    rate.length = 0;
    histories.length = 0;
    while( $('table tr').length > 1) {
      $('table tr:last').remove();
    }
    var str = document.getElementById("handle").value;
    user = str.split(",");
    for(var i = 0; i < user.length; i++){
      getAtcoderRating(user[i]);
    }
}

function getAtcoderRating(handle){
    var call =  function() {
        var url = "https://atcoder.jp/user/" + handle;
        var xpath = '//*[@id="main-div"]/div/div/div/script';
        var query = "select * from htmlstring where url = '" + url + "' and xpath = '" + xpath + "'";
        var yql   = "https://query.yahooapis.com/v1/public/yql?format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&q=" + encodeURIComponent(query);
        $.ajax(
          {
            type     : 'GET',
            url      : yql,
            dataType : 'json',
            timeout  : 10000,
            cache    : false,
          }).done(function(data){
              //console.log(data);
              var jsonStr = getAtcoderJSON(data.query.results.result);
              var history_atcoder = JSON.parse(jsonStr);

              var highest = 0;
              for(var i = 0; i < history_atcoder.length; i++){
                if(highest < history_atcoder[i][1]){
                  highest = history_atcoder[i][1];
                }
              }
              rate.push([handle,history_atcoder[0][1],highest]);
              history_atcoder.sort(function(a,b){ //日付を昇順ソート
                return a[0] - b[0];
                });

              histories.push([handle,history_atcoder]);
              count++;

              if(count === user.length){
                  histories.sort(function(a,b){ //userをレートでソート
                      return b[1][b[1].length - 1][1] - a[1][a[1].length - 1][1];
                    });
                  makeTable();
                  makeGraph();
              }

          }).fail(function(data){
              alert("Failed(AC)");
          //    console.log(data);
          });
      }
      call();

}

function getAtcoderJSON(src) {
        //alert(src);
        var idxf = src.indexOf('JSON.parse("');
        var idxe = src.indexOf('");]]>', idxf);
        if (idxf != -1 && idxe != -1) {
    	     return src.slice(idxf + 12, idxe).replace(/\\/g, "");
        }
        return null;
}

function makeTable(){

      var tweet = "";

      tweet += "AtCoder Rate Ranking\n"

        var cnt = 1;
        var colors = ['gray','brown','green','lightskyblue','blue','gold','orange','red'];
        for(var rating = 5000; rating > 0; rating--){
            for (var r = 0; r < user.length; r++) {
                if(rate[r][1] === rating){
                    if(cnt <= 5){
                        var trJQ_r = $('<tr></tr>').addClass('top').appendTo(tableJQ);
                    }else{
                        var trJQ_r = $('<tr></tr>').appendTo(tableJQ);
                    }
                    $('<td></td>').text(cnt).appendTo(trJQ_r);
                    var url = 'https://atcoder.jp/user/';
                    url += rate[r][0];
                    var rateColor = Math.min(Math.floor(rate[r][1]/400),7);
                    $('<td></td>').append(
                        $('<font></font>').text(rate[r][1] + ' (' + rate[r][2] + ')').attr('color',colors[rateColor])
                      ).appendTo(trJQ_r);

                    $('<td></td>').append(
                            $('<a></a>').append(
                                $('<font></font>').text(rate[r][0]).attr('color',colors[rateColor])
                              ).attr('href',url)
                        ).appendTo(trJQ_r);

                    tweet += cnt + ". " + rate[r][0] + " (" + rate[r][1] + ")\n";

                    cnt++;

                  }
              }
          }
      //    tweet += "https://rika0384.github.io/atcoder/atcoder_rating_comparison/index.html";
/*
          if(firstQuery === false){
             $(tweetplace).empty();
          }
*/
/*
        $.fn.appendTweetButton = function(url, text){
              $(this).append($("<a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-url=\""+url+"\" data-text=\""+text+"\" data-count=\"vertical\">Tweet<\/a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');<\/script>"));
              }
          $("body").appendTweetButton($(location).attr('href'), tweet);
          firstQuery = false;
*/

        var $widget = $("#twitter-widget-0");
        var src = $widget.attr("src");
        var url = src.replace(/\&text=.*\&/, "&text=" + encodeURIComponent(tweet) + "&");

        $widget.attr({src: url});
        tweetplace.html("").append($widget);
}



function makeSeries(){
      /*
        {user_id, [x:日時, y:レート, contestName, user_id]}
      */

      var ret = [];

      for(var i = 0; i < user.length; i++){
        //  console.log(history[i]);
          var user_id = histories[i][0];
        //  console.log(user_id);
          var data = [];
          for(var j = 0; j < histories[i][1].length; j++){
              var x = histories[i][1][j][0] * 1000;
              var y = histories[i][1][j][1];
              var contestName = histories[i][1][j][3];
              data.push({x, y, contestName, user_id});
          }
          ret.push({name:user_id,data});
      }

      return ret;

}


function makeGraph(){

    new Highcharts.Chart({
            title: { text: null },
            tooltip: {
              formatter: function () {
                return `<b>${this.point.user_id}</b><br />` +
                  `Contest: ${this.point.contestName}<br />` +
                  `Date: ${Highcharts.dateFormat('%e %b %Y', this.x)}<br />` +
                  `Rate: ${this.y}`;
              }
            },
            xAxis: {
              type: 'datetime',
              title: { text: null },
              dateTimeLabelFormats: { year: '%Y' },
              tickInterval: 30758400000
            },
            yAxis: {
              min: 0,
              startOnTick: false,
              title: { text: null },
              plotLines: [{ value: 0, width: 1, color: '#808080' }],
              tickInterval: 400,
              max: 3200,
              plotBands: [
                { "from": 0, "to": 400 -1, "color": '#F9F9F9' },
                { "from": 400, "to": 800 - 1, "color": '#F9E6D3' },
                { "from": 800, "to": 1200 - 1, "color": '#D3F9D3' },
                { "from": 1200, "to": 1600 - 1, "color": '#D3FCFC' },
                { "from": 1600, "to": 2000 -1, "color": '#D3D3FF' },
                { "from": 2000, "to": 2400 - 1, "color": '#FCFCC3' },
                { "from": 2400, "to": 2800 - 1, "color": '#FFE9C3' },
                { "from": 2800, "to": 1000000, "color": '#FFC3C3' },
              ]
            },
            chart: { height: 600, type: 'line', zoomType: 'x', renderTo: 'graph-container' },
            plotOptions: { series: { marker: { enabled: false } } },
            credits: { enabled: false },
            series: makeSeries()
      });

}
