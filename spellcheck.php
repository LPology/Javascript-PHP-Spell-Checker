<?php

/**
 * Javascript/PHP Spell Checker
 * Version 1.6
 * https://github.com/LPology/Javascript-PHP-Spell-Checker
 *
 * Copyright 2012-2015 LPology, LLC  
 * Released under the MIT license
 *
 * Requires the Pspell extension
 * http://www.php.net/manual/en/book.pspell.php 
 */ 

if (isset($_REQUEST['text'])) {
  $text = $_REQUEST['text'];
} else {
  exit(json_encode(array('success' => false)));
}

if (!$pspell = pspell_new('en', '', '', '', PSPELL_FAST)) {
  exit(json_encode(array('success' => false)));
}

$words = preg_split('/[\W]+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
$misspelled = array();
$return = array();

foreach ($words as $w) {
  if (!pspell_check($pspell, $w) && !is_numeric($w)) {
    $misspelled[] = $w;
  }
}

if (sizeof($misspelled) < 1) {
  exit(json_encode(array('success' => true, 'errors' => false)));
}

foreach ($misspelled as $m) {
  $return[$m] = pspell_suggest($pspell, $m);
}

echo json_encode(array('success' => true, 'errors' => true, 'words' => $return));
