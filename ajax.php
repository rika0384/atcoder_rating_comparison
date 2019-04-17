<?php
    if(isset($_GET["url"]) && preg_match("/^https?:/",$_GET["url"])){
        echo file_get_contents($_GET["url"]);
    }else{
        echo "error";
    }
?>
