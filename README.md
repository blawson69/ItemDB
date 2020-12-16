# ItemDB
This [Roll20](http://roll20.net/) script is a database of items for D&D 5e that provides functions for viewing item descriptions and adding them to character sheets. It functions on it's own but is designed to support other scripts such as [LootGenerator](https://github.com/blawson69/LootGenerator).

ItemDB is currently only for use with the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped).

## Installation
Download the `ItemDB.js` and the SRD database `ItemDB-SRD.json` from the project root folder. Add the .js file to the API _before_ adding the .json file to ensure database import.

There are additional database enhancements in the `db enhancements` folder for those who have the requisite compendium upgrades. You can download and add them to the API after the SRD database file. If you own other expansions or rule books that are not included in that folder and wish to include those items, feel free to contact me on a custom database add-on.

## Show
The show function `!idb show [item name]` displays information for the item named. The name **is** case sensitive, so sending 'dagger' will not work but 'Dagger' will. Weapons and Armor will display basic stats along with any available descriptions.
```
!idb show Breastplate
!idb show Dagger of Venom
!idb show Iron Bands of Bilarro
```

## Add
The add function allows an item to be added to a designated character. Select items have an option for adding to an alternate section (see [below](#options)). To use, simply send `!idb add [item name]` with the character's token selected.
```
!idb add Breastplate
!idb add Dagger of Venom
!idb add Iron Bands of Bilarro
```

## Modifications
Some item names and descriptions have been slightly modified from the SRD or original source to work within the script and provide consistent function for external scripts.
- Adventuring gear with a container or quantity designated in the name have been changed to separate that information. For example, the "Hempen Rope (50 feet)" is now named "Hempen Rope" and the length is now a note in the description. "Caltrops (bag of 20)" is now "Caltrops" with the quantity in the description. "Acid (Vial)" is simply "Acid".
- Items such as "Map or Scroll Case" have been broken out into two separate items.
- Tools, instruments, gaming sets, and spell focus items are all included individually along with the traditional list of adventuring items.
- Items whose name is changed for the SRD have duplicate entries to ensure matches. For instance, "Daern's Instant Fortress" is also listed as "Instant Fortress".
- Wondrous items with options are listed separately by option, with the option name following a spaced hyphen. For instance, "Bag of Tricks" has three separate listings: "Bag of Tricks - Gray", "Bag of Tricks - Rust" and "Bag of Tricks - Tan".

## Config Options
If you wish to allow players to view descriptions of items using the [show command](#show), you can turn this on. This will be honored when ItemDB is used through another script.

ItemDB also functions as an enhanced replacement of the [PotionManager](https://github.com/blawson69/PotionManager) and [GearManager](https://github.com/blawson69/GearManager) scripts. As such, you have the option to place certain items in the Offense or Utility sections rather than the Equipment section to give easier access through use of the [Shaped Script](https://github.com/mlenser/roll20-api-scripts/tree/master/5eShapedScript) and its ability to automatically decrement the number of uses on consumable items such as potions, as well as making relevant items such as acid and holy water useable as improvised weapons.

These settings can be accessed through the config menu `!idb config`.
