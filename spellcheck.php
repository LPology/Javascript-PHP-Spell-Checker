<?php

/**
 * Javascript/PHP Spell Checker v1.0.0
 * https://github.com/LPology/Javascript-PHP-Spell-Checker
 *
 * Copyright 2012 LPology, LLC  
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

if (!$pspell = pspell_new('en')) {
	exit(json_encode(array('success' => false)));
}

$words = preg_split('/[\W]+?/',$text);
$misspelled = array();
$return = array();

foreach ($words as $w) {
	if (preg_match('/^[A-Z]*$/',$w)) {
		continue;
	}
	if (!pspell_check($pspell, $w)) {
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