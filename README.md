# ItemDB
This [Roll20](http://roll20.net/) script is a database of items for D&D 5e that provides functions for viewing item descriptions and adding them to character sheets. It functions on it's own but is designed to support other scripts such as [LootGenerator](https://github.com/blawson69/LootGenerator).

ItemDB has two versions: The folder named `Shaped` contains all files for use with the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped). These files also have `Shaped` in the name for later identification. The folder `OGL` is for games using the D&D 5E by Roll20 (OGL) sheet and have `OGL` in the name. _Do not mix files from different folders_, as the data is completely different and will break the script.

## Installation
From the appropriate folder, download the `ItemDB-[sheet-name].js` you need along with the appropriate SRD database `SRD-[sheet-name]-IDb.json`. Add the .js file to the API _before_ adding the .json file to ensure database import.

There are additional item databases in the `db enhancements` subfolders for those who have the requisite compendium upgrades. You can download and add them to the API after the SRD database file. If you own other expansions or rule books that are not included in that folder and wish to include those items, feel free to contact me on a custom database add-on.

## Show
The show function `!idb show [item name]` displays information for the item named. The name **is** case sensitive, so sending 'dagger' will not work but 'Dagger' will. Weapons and Armor will display basic stats along with any available descriptions. All results are whispered.
```
!idb show Breastplate
!idb show Dagger of Venom
!idb show Iron Bands of Bilarro
```

## Add
The add function allows an item to be added to a designated character. To use, simply send `!idb add [item name]` with the character's token selected.
```
!idb add Breastplate
!idb add Dagger of Venom
!idb add Iron Bands of Bilarro
```
For the Shaped Sheet, select items have an option for adding to an alternate section (see [below](#config-options)). For the OGL sheet, items are added to the Equipment section of the character sheet. If these items have an attack or can be used as a resource, you will currently need to check the appropriate box in the item settings manually once they have been added.

## Modifications
Some item names and descriptions have been slightly modified from the SRD or original source book to work within the script and provide consistent function for external scripts.
- Adventuring gear with a container or quantity designated in the name have been changed to remove the extra information. For example, the "Hempen Rope (50 feet)" is now named "Hempen Rope" and the length is now a note in the description. "Caltrops (bag of 20)" is now "Caltrops" with the quantity in the description. "Acid (Vial)" is simply "Acid".
- Items such as "Map or Scroll Case" have been broken out into two separate items: "Map Case" and "Scroll Case".
- Items whose name is changed for the SRD have duplicate entries to ensure matches. For instance, "Daern's Instant Fortress" is also listed as "Instant Fortress".
- Wondrous items with options are listed separately by option, with the option name following a spaced hyphen. For instance, "Bag of Tricks" has three separate listings: "Bag of Tricks - Gray", "Bag of Tricks - Rust" and "Bag of Tricks - Tan".

## Config Options
The following settings can be accessed through the config menu `!idb config`:

- If you wish to allow players to view descriptions of items using the [show command](#show), you can turn this on. Honoring this setting may be optional when ItemDB is used by another script.

- **Shaped Sheet version only** You may want to redirect certain items to more useful areas like Offense or Utility. This allows for ease of access through the respective section macros, rolling of die for healing potions, making relevant items such as acid and holy water useable as improvised weapons, etc. These redirects are off by default. This functions as an enhanced replacement of the (now deprecated) [PotionManager](https://github.com/blawson69/PotionManager) and [GearManager](https://github.com/blawson69/GearManager) scripts.

- You may choose to allow ItemDB to show/add any items not present in the ItemDB database as unknown adventuring gear instead of giving an "item not found" error. This will default the item to a weight of 1 with a description of "Unknown item." and will add the item to the default section for your character sheet.

---
_This script and its contents are permissible under the Wizards of the Coast's [Fan Content Policy](https://company.wizards.com/fancontentpolicy). Portions of the data used are property of and © Wizards of the Coast LLC._
