/*
ItemDB
A roll20 database of D&D 5e items for Roll20 scripts. OGL version.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l

Like this script? Buy me a coffee:
    https://venmo.com/theRealBenLawson
    https://paypal.me/theRealBenLawson
*/

var ItemDB = ItemDB || (function () {
    'use strict';

    //---- INFO ----//
    var version = '2.0',
    debugMode = false,
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px;',
        title: 'padding: 0 0 10px 0; color: ##591209; font-size: 1.5em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        subtitle: 'margin-top: -4px; padding-bottom: 4px; color: #666; font-size: 1.125em; font-variant: small-caps;',
        statsWrapper: 'margin-top: 4px; margin-bottom: 12px; padding: 6px 2px; border-bottom: 1px solid #ddd; border-top: 1px solid #ddd;',
        button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
        textButton: 'background-color: transparent; border: none; padding: 0; color: #591209; text-decoration: underline;',
        buttonWrapper: 'text-align: center; margin: 10px 0; clear: both;',
        code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
        alert: 'color: #C91010; font-size: 1.5em; font-weight: bold; font-variant: small-caps; text-align: center;'
    },

    checkInstall = function () {
        if (!_.has(state, 'ItemDB')) state['ItemDB'] = state['ItemDB'] || {};
        if (typeof state['ItemDB'].data == 'undefined') state['ItemDB'].data = {};
        if (typeof state['ItemDB'].confirmReset == 'undefined') state['ItemDB'].confirmReset = generateUUID();
        if (typeof state['ItemDB'].playerShow == 'undefined') state['ItemDB'].playerShow = false;
        if (typeof state['ItemDB'].autoAttacks == 'undefined') state['ItemDB'].autoAttacks = false;
        if (typeof state['ItemDB'].autoResources == 'undefined') state['ItemDB'].autoResources = false;
        if (typeof state['ItemDB'].addCustom == 'undefined') state['ItemDB'].addCustom = false;

        log('--> ItemDB OGL v' + version + ' <-- Initialized');
		if (debugMode) {
			var d = new Date();
			showDialog('Debug Mode', 'ItemDB OGL v' + version + ' loaded at ' + d.toLocaleTimeString() + '<br><a style=\'' + styles.textButton + '\' href="!idb config">Show config</a>', 'GM');
		}
    },

    //----- INPUT HANDLER -----//
    handleInput = function (msg) {
        if (msg.type == 'api' && msg.content.startsWith('!idb')) {
			var parms = msg.content.split(/\s+/i);
			if (parms[1]) {
				switch (parms[1]) {
					case 'config':
						if (playerIsGM(msg.playerid)) {
							commandConfig(msg);
						}
						break;
					case 'show':
						if (playerIsGM(msg.playerid) || state['ItemDB'].playerShow) {
							commandShowInternal(msg);
						}
						break;
					case 'get':
						commandGet(msg.content);
						break;
					case 'add':
                        if (playerIsGM(msg.playerid)) {
                            commandAddInternal(msg);
                        }
						break;
					case 'load':
						commandLoadDB(msg);
						break;
					case 'list':
						commandListDB(msg);
						break;
					case 'reset':
                        if (playerIsGM(msg.playerid)) {
                            commandResetDB(msg);
                        }
						break;
                    case 'help':
                    default:
                        if (playerIsGM(msg.playerid)) {
                            commandHelp(msg);
                        }
				}
			} else {
				commandHelp(msg);
			}
		}
    },

    commandShowInternal = function (msg) {
        commandShow(msg.content, msg.who, true);
    },

    commandShow = function (cmd, who = 'GM', internal = false) {
        if (typeof state['ItemDB'].data.name == 'undefined') {
            showDialog('Error', 'Database not found. Please upload an ItemDB database to the API and restart the sandbox.', 'GM');
            return;
        }

        var item_name = cmd.replace('!idb show', '').trim(), item;
        var types = {'MELEE_WEAPON': 'Melee weapon', 'RANGED_WEAPON': 'Ranged weapon', 'LIGHT_ARMOR': 'Light armor', 'MEDIUM_ARMOR': 'Medium armor', 'HEAVY_ARMOR': 'Heavy armor', 'SHIELD':'Shield'};

        var item = commandGet(item_name);
        if (item) {
            var content = (typeof item.itemcontent != 'undefined' && item.itemcontent != '') ? item.itemcontent.replace(/\n/g, '<br>') : '*No description available.*';
            var mods = (typeof item.itemmodifiers != 'undefined' && item.itemmodifiers != '') ? item.itemmodifiers.replace(/(Item\sType:\s[^,]+,?)/g, '').trim() : '';
            var subhead = (item.category == 'Weapon' || item.category == 'Armor') ? types[item.type] : item.category;

            var message = '<div style="' + styles.subtitle + '">' + subhead + '</div><div style="' + styles.statsWrapper + '">';
            if (mods != '') message += mods + (mods.endsWith('.') ? '' : '.') + ' ';
            message += ' Weight: ' +  item.weight + '.';
            if (typeof item.itemproperties != 'undefined' && item.itemproperties != '') message += '<br>*Properties:* ' + item.itemproperties + '.';
            message += '</div>';

            if (internal) showDialog(item.itemname, message + content, who);
            else return {title: item.itemname, desc: message + content};
        } else {
            if (internal) showDialog('Error', '"' + item_name + '" not found.', who);
            else return {title: 'Error', desc: '"' + item_name + '" not found.'};
        }
    },

    commandAddInternal = function (msg) {
        var cmd = msg.content;
        if (_.size(msg.selected) == 0) {
            showDialog('Error', 'No tokens selected.', msg.who);
        } else {
            var token = getObj(msg.selected[0]._type, msg.selected[0]._id);
            commandAdd(msg.content, token.get('represents'), true);
        }
    },

    commandAdd = function (cmd, char_id, internal = false) {
        var err = [], done = true;
        if (typeof state['ItemDB'].data.name == 'undefined') {
            if (internal) showDialog('Error', 'No database found! Please upload an ItemDB database to the API and restart the sandbox.', who);
            else err.push('No database found! Please upload an ItemDB database to the API and restart the sandbox.');
            return done;
        }

        var item_name = cmd.replace('!idb add', '').trim();
        var item = commandGet(item_name);
        var char = getObj('character', char_id);
        if (item && char) {
            var newItem = {
                itemname: item.itemname,
                itemproperties: (typeof item.itemproperties != 'undefined') ? item.itemproperties : '',
                itemweight: (typeof item.weight != 'undefined') ? item.weight.toString() : '1',
                itemcontent: (typeof item.itemcontent != 'undefined') ? item.itemcontent : '',
                itemmodifiers: item.itemmodifiers,
                itemcount: 1,
                equipped: 1,
                hasattack: 0,
                useasresource: 0
            };

            var currItemID = findCurrItemID(char_id, item.itemname);
            if (!currItemID) {
                // Create item if not found
                const data = {};
                var rowID = generateRowID();
                var repString = 'repeating_inventory_' + rowID;
                Object.keys(newItem).forEach(function (field) {
                    data[repString + '_' + field] = newItem[field];
                });
                setAttrs(char_id, data);

                /*
                setTimeout(function () {
                    // Create Attack entry for item
                    if (item.hasattack && state['ItemDB'].autoAttacks) {
                        var tmp_attack = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_inventory_' + rowID + '_hasattack' })[0];
                        //setAttrs(character_id, attribute_obj, settings(optional))
                        tmp_attack.setWithWorker('current', 1);
                    }

                    // Create Resource entry for item
                    if (item.useasresource && state['ItemDB'].autoResources) {
                        var tmp_resource = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_inventory_' + rowID + '_useasresource' })[0];
                        tmp_resource.setWithWorker('current', 1);
                    }
                }, 500);
                */

            } else {
                // Update count for existing item
                var tmp_count = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_inventory_' + currItemID + '_itemcount' })[0];
                tmp_count.setWithWorker('current', toNumber(tmp_count.get('current')) + 1);
            }

            if (internal) {
                showDialog('Item Added', item.itemname + ' was added to your inventory.', char.get('name'));
                showDialog('', item.itemname + ' was added to ' + char.get('name') + '\'s inventory.', 'GM');
            }
        } else {
            if (!item) err.push('"' + item_name + '" was not found.');
            if (!char) err.push('Character not selected or invalid character ID "' + char_id + '".');
            if (internal) showDialog('Error', err.join('<br>'), 'GM');
            done = false;
        }

        return done;
    },

    commandGet = function (item_name) {
        var item_name = item_name.replace('!idb get', '').trim(), item;
        if (state['ItemDB'].data == {}) {
            return item;
        }

        // AMMO
        if (_.find(_.pluck(state['ItemDB'].data.ammo, 'itemname'), function (x) {return item_name.indexOf(x) != -1;})) {
            item = _.clone(_.find(state['ItemDB'].data.ammo, function (x) { return item_name.indexOf(x.itemname) != -1; }));

            if (item && item.itemname !== item_name) {
                var base_name = item.itemname, e_name = item_name.replace(base_name, '').trim();
                var enchantment = _.clone(_.find(state['ItemDB'].data.ammo_enchantments, function (x) {return e_name.indexOf(x.itemname) != -1;}));

                if (item && enchantment) {
                    var w_content = (typeof item.itemcontent == 'undefined') ? '' : item.itemcontent,
                    e_content = enchantment.itemcontent, combo_content;
                    if (e_content.indexOf('Curse.') != -1) combo_content = e_content + (w_content != '' ? w_content + '\n\n' : '');
                    else combo_content = (w_content != '' ? w_content + '\n\n' : '') + e_content;

                    if (enchantment.itemmodifiers != '') item.itemmodifiers += ', ' + enchantment.itemmodifiers;

                    item.itemname = item_name;
                    item.itemcontent = combo_content;
                }
            }

        // WEAPONS
        } else if (_.find(_.pluck(state['ItemDB'].data.magic_weapons, 'itemname'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.magic_weapons, function (x) {return x.itemname == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.weapons, 'itemname'), function (x) {return item_name.indexOf(x) != -1;})) {
            item = _.clone(_.find(state['ItemDB'].data.weapons, function (x) { return item_name.indexOf(x.itemname) != -1; }));
            if (item && item.itemname !== item_name) {
                var base_name = item.itemname, e_name = item_name.replace(base_name, '').trim();
                var enchantment = _.clone(_.find(state['ItemDB'].data.weapon_enchantments, function (x) {return e_name.indexOf(x.itemname) != -1;}));

                if (item && enchantment) {
                    var w_content = (typeof item.itemcontent == 'undefined') ? '' : item.itemcontent,
                    e_content = enchantment.itemcontent, combo_content;
                    if (e_content.indexOf('Curse.') != -1) combo_content = e_content + (w_content != '' ? w_content + '\n\n' : '');
                    else combo_content = (w_content != '' ? w_content + '\n\n' : '') + e_content;

                    if (enchantment.itemmodifiers != '') item.itemmodifiers += ', ' + enchantment.itemmodifiers;

                    item.itemname = item_name;
                    item.itemcontent = combo_content;
                }
            }

        // ARMOR
        } else if (_.find(_.pluck(state['ItemDB'].data.magic_armor, 'itemname'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.magic_armor, function (x) {return x.itemname == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.armor, 'itemname'), function (x) {return item_name.indexOf(x) != -1;})) {
            item = _.clone(_.find(state['ItemDB'].data.armor, function (x) { return item_name.indexOf(x.itemname) != -1; }));

            if (item && item.itemname !== item_name) {
                var base_name = item.itemname, e_name = item_name.replace(base_name, '').trim();
                var enchantment = _.clone(_.find(state['ItemDB'].data.armor_enchantments, function (x) {return e_name.indexOf(x.itemname) != -1;}));

                if (item && enchantment) {
                    var w_content = (typeof item.itemcontent == 'undefined') ? '' : item.itemcontent,
                    e_content = enchantment.itemcontent, combo_content;
                    if (e_content.indexOf('Curse.') == -1) combo_content = e_content + (w_content != '' ? '\n\n' + w_content : '');
                    else combo_content = (w_content != '' ? w_content + '\n\n' : '') + e_content;

                    if (enchantment.itemmodifiers != '') item.itemmodifiers += ', ' + enchantment.itemmodifiers;

                    item.itemname = item_name;
                    item.itemcontent = combo_content;
                }
            }

        // ADVENTURING GEAR (everything else)
        } else if (_.find(_.pluck(state['ItemDB'].data.adv_gear, 'itemname'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.adv_gear, function (x) {return x.itemname == item_name;});
        } else if (state['ItemDB'].addCustom) {
            item = {category:"Adventuring Gear", itemname:item_name, weight:1, itemmodifiers:'', itemproperties:'', itemcontent:"Unknown item."};
        }

        return (typeof item != 'undefined') ? _.clone(item) : item;
    },

    findCurrItemID = function(char_id, item_name) {
        var row_id, re = new RegExp('^repeating_inventory_.*_itemname$', 'i');
        var items = _.filter(findObjs({type: 'attribute', characterid: char_id}), function (x) { return x.get('name').match(re) !== null; });
        var this_item = _.find(items, function (i) { return (i.get('current').replace(/\W/, '') == item_name.replace(/\W/, '')); });
        if (this_item) row_id = this_item.get('name').split('_')[2];
        return row_id;
    },

    rollDice = function (expr) {
        expr = expr.replace(/\s+/g, '');
        var exp = expr.split(/[^\d]+/);
        var result = 0, dice = parseInt(exp[0]), die = parseInt(exp[1]);
        var bonus = (typeof exp[2] != 'undefined') ? parseInt(exp[2]) : 0;
        var re = new RegExp('^.+\-' + bonus + '$', 'i');
        if (expr.match(re) !== null) bonus = bonus * -1;
        for (var x = 0; x < dice; x++) {
            result += randomInteger(die);
        }
        result = result + bonus;
        return (result < 1 ? 1 : result);
    },

    toNumber = function (num) {
        if (typeof num == 'string') num = num.replace(/\D+/gi, '');
        return Number(num);
    },

    commandConfig = function (msg) {
        var message = '', parms = msg.content.replace('!idb config ', '').split(/\s*\-\-/i);
        if (parms[1]) {
            if (parms[1] == 'toggle-show') state['ItemDB'].playerShow = !state['ItemDB'].playerShow;
            if (parms[1] == 'toggle-atks') state['ItemDB'].autoAttacks = !state['ItemDB'].autoAttacks;
            if (parms[1] == 'toggle-recs') state['ItemDB'].autoResources = !state['ItemDB'].autoResources;
            if (parms[1] == 'toggle-add') state['ItemDB'].addCustom = !state['ItemDB'].addCustom;
        }

        message += '<div style=\'' + styles.title + '\'>Player Access</div>';
        message += 'When turned on, players have access to the "show" command. <a style="' + styles.textButton + '" href="!idb config --toggle-show"> turn ' + (state['ItemDB'].playerShow ? 'off' : 'on') + '</a><br><br>';

        message += '<div style=\'' + styles.title + '\'>Auto Attacks</div>';
        message += 'When turned on, items that have an attack will automatically have an entry in the Attacks and Spellcasting section created. This includes improvised weapons such as Acid, Holy Water, and Oil. <a style="' + styles.textButton + '" href="!idb config --toggle-atks"> turn ' + (state['ItemDB'].autoAttacks ? 'off' : 'on') + '</a><br><br>';

        message += '<div style=\'' + styles.title + '\'>Auto Resources</div>';
        message += 'When turned on, items that are used as a resource will automatically have a Resource created. This includes items such as ammunition and potions. <a style="' + styles.textButton + '" href="!idb config --toggle-recs"> turn ' + (state['ItemDB'].autoResources ? 'off' : 'on') + '</a><br><br>';

        message += '<div style=\'' + styles.title + '\'>Unknown Items</div>';
        message += 'When turned on, items not present in the database will be shown/added as adventuring gear with a "Unknown item" description instead displaying an error. <a style="' + styles.textButton + '" href="!idb config --toggle-add"> turn ' + (state['ItemDB'].addCustom ? 'off' : 'on') + '</a>';

        message += '<hr><p>See the <a style="' + styles.textButton + '" href="https://github.com/blawson69/ItemDB">documentation</a> for complete instructions.</p>';
        showDialog('', message, msg.who);
	},

    commandHelp = function (msg) {
        // Show help dialog
        var message = 'Use <span style=\'' + styles.code + '\'>!idb config</span> to access the configuration menu.';
        message += '<br><br>Use <span style=\'' + styles.code + '\'>!idb show [item_name]</span> to see a description of the named item.';
        message += '<br><br>Use <span style=\'' + styles.code + '\'>!idb add [item_name]</span> to add the named item to a selected character.';

        message += '<hr><p>See the <a style="' + styles.textButton + '" href="https://github.com/blawson69/ItemDB">documentation</a> for complete instructions.</p>';

        showDialog('Help Menu', message, msg.who);
    },

    showDialog = function (title, content, whisperTo = '') {
        // Outputs a pretty box in chat with a title and content
        var gm = /\(GM\)/i;
        title = (title == '') ? '' : '<div style=\'' + styles.title + '\'>' + title + '</div>';
        var body = '<div style=\'' + styles.box + '\'>' + title + '<div>' + content + '</div></div>';
        if (whisperTo.length > 0) {
            whisperTo = '/w ' + (gm.test(whisperTo) ? 'GM' : '"' + whisperTo + '"') + ' ';
            sendChat('ItemDB', whisperTo + body, null, {noarchive:true});
        } else  {
            sendChat('ItemDB', body);
        }
    },

    processNotes = function (notes) {
        var retval, text = notes.trim();
        text = text.replace(/<p[^>]*>/gi, '<p>').replace(/<br>/gi, '\n').replace(/<\/?(span|div|pre|img|code|b|i)[^>]*>/gi, '');
        if (text != '' && /<p>[^<]*<\/p>/g.test(text)) retval = text.match(/<p>[^<]*<\/p>/g).map( l => l.replace(/^<p>([^<]*)<\/p>$/,'$1'));
        return retval;
    },

    commandPlayerShow = function () {
        return state['ItemDB'].playerShow;
    },

    commandResetDB = function (msg) {
        if (msg.content.indexOf(state['ItemDB'].confirmReset) == -1) {
            showDialog('ItemDB Reset', '*This function will erase the current database.* You will not be able to use ItemDB until the API sandbox is reset.<br><br>If you wish to proceed, click confirmation button below.<br><div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!idb reset ' + state['ItemDB'].confirmReset + '">CONFIRM</a></div>', 'GM');
        } else {
            state['ItemDB'].data = {};
            state['ItemDB'].confirmReset = generateUUID();
            showDialog('Reset Complete', 'The ItemDB database has been reset. To re-load database(s) you must restart the API sandbox.', 'GM');
        }
    },

    commandLoadDB = function (data) {
        var res = {err: false, msg: '', count: 0}, tmp_ct = 0, message = '';
        if (typeof state['ItemDB'].data.name == 'undefined') {
            state['ItemDB'].data = {name: 'ItemDB Data', version: version, weapons:[], magic_weapons: [], weapon_enchantments: [], ammo:[], ammo_enchantments:[], armor:[], magic_armor:[], armor_enchantments:[], adv_gear:[], potions:[], poisons:[], wondrous_items:[] };
        }

        if (typeof data.name != 'undefined' && data.name.indexOf('ItemDB') != -1) {
            if (typeof data.weapons == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.weapons);
                message = _.size(data.weapons) + ' weapons to load.';
                _.each(data.weapons, function(weapon) {
                    state['ItemDB'].data.weapons = _.reject(state['ItemDB'].data.weapons, function(x) {return x.itemname == weapon.itemname});
                    state['ItemDB'].data.weapons.push(weapon);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.weapons = _.uniq(state['ItemDB'].data.weapons);
                if (debugMode) log(message);
            }

            if (typeof data.magic_weapons == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.magic_weapons);
                message = _.size(data.magic_weapons) + ' magic weapons to load.';
                _.each(data.magic_weapons, function(item) {
                    state['ItemDB'].data.magic_weapons = _.reject(state['ItemDB'].data.magic_weapons, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.magic_weapons.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.magic_weapons = _.uniq(state['ItemDB'].data.magic_weapons);
                if (debugMode) log(message);
            }

            if (typeof data.weapon_enchantments == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.weapon_enchantments);
                message = _.size(data.weapon_enchantments) + ' weapon enchantmentss to load.';
                _.each(data.weapon_enchantments, function(item) {
                    state['ItemDB'].data.weapon_enchantments = _.reject(state['ItemDB'].data.weapon_enchantments, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.weapon_enchantments.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.weapon_enchantments = _.uniq(state['ItemDB'].data.weapon_enchantments);
                if (debugMode) log(message);
            }

            if (typeof data.ammo == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.ammo);
                message = _.size(data.ammo) + ' ammo to load.';
                _.each(data.ammo, function(item) {
                    state['ItemDB'].data.ammo = _.reject(state['ItemDB'].data.ammo, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.ammo.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.ammo = _.uniq(state['ItemDB'].data.ammo);
                if (debugMode) log(message);
            }

            if (typeof data.ammo_enchantments == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.ammo_enchantments);
                message = _.size(data.ammo_enchantments) + ' ammo enchantments to load.';
                _.each(data.ammo_enchantments, function(item) {
                    state['ItemDB'].data.ammo_enchantments = _.reject(state['ItemDB'].data.ammo_enchantments, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.ammo_enchantments.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' ammo enchantments loaded.';
                state['ItemDB'].data.ammo_enchantments = _.uniq(state['ItemDB'].data.ammo_enchantments);
                if (debugMode) log(message);
            }

            if (typeof data.armor == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.armor);
                message = _.size(data.armor) + ' armor to load.';
                _.each(data.armor, function(item) {
                    state['ItemDB'].data.armor = _.reject(state['ItemDB'].data.armor, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.armor.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.armor = _.uniq(state['ItemDB'].data.armor);
                if (debugMode) log(message);
            }

            if (typeof data.magic_armor == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.magic_armor);
                message = _.size(data.magic_armor) + ' magic armor to load.';
                _.each(data.magic_armor, function(item) {
                    state['ItemDB'].data.magic_armor = _.reject(state['ItemDB'].data.magic_armor, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.magic_armor.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.magic_armor = _.uniq(state['ItemDB'].data.magic_armor);
                if (debugMode) log(message);
            }

            if (typeof data.armor_enchantments == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.armor_enchantments);
                message = _.size(data.armor_enchantments) + ' armor enchantments to load.';
                _.each(data.armor_enchantments, function(item) {
                    state['ItemDB'].data.armor_enchantments = _.reject(state['ItemDB'].data.armor_enchantments, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.armor_enchantments.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.armor_enchantments = _.uniq(state['ItemDB'].data.armor_enchantments);
                if (debugMode) log(message);
            }

            if (typeof data.adv_gear == 'object') {
                tmp_ct = 0;
                res.count += _.size(data.adv_gear);
                message = _.size(data.adv_gear) + ' adventuring gear to load.';
                _.each(data.adv_gear, function(item) {
                    state['ItemDB'].data.adv_gear = _.reject(state['ItemDB'].data.adv_gear, function(x) {return x.itemname == item.itemname});
                    state['ItemDB'].data.adv_gear.push(item);
                    tmp_ct++;
                });
                message += '... ' + tmp_ct + ' loaded.';
                state['ItemDB'].data.adv_gear = _.uniq(state['ItemDB'].data.adv_gear);
                if (debugMode) log(message);
            }

        } else {
            res.err = true;
            res.msg = 'Script was not an ItemDB database.';
        }

        if (!res.err) res.msg = '"' + data.name + '" database upload complete. ' + res.count + ' items added.';
        log((res.err ? 'Error!' : '') + res.msg);
    },

    generateUUID = (function () {
        "use strict";
        var a = 0, b = [];
        return function() {
            var c = (new Date()).getTime() + 0, d = c === a;
            a = c;
            for (var e = new Array(8), f = 7; 0 <= f; f--) {
                e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
                c = Math.floor(c / 64);
            }
            c = e.join("");
            if (d) {
                for (f = 11; 0 <= f && 63 === b[f]; f--) {
                    b[f] = 0;
                }
                b[f]++;
            } else {
                for (f = 0; 12 > f; f++) {
                    b[f] = Math.floor(64 * Math.random());
                }
            }
            for (f = 0; 12 > f; f++){
                c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
            }
            return c;
        };
    }()),

    generateRowID = function () {
        "use strict";
        return generateUUID().replace(/_/g, "Z");
    },

    //---- PUBLIC FUNCTIONS ----//
    registerEventHandlers = function () {
		on('chat:message', handleInput);
	};

    return {
		checkInstall: checkInstall,
		registerEventHandlers: registerEventHandlers,
        loadDB: commandLoadDB,
        playerAccess: commandPlayerShow,
        describe: commandShow,
        add: commandAdd,
        get: commandGet
	};
}());

on("ready", function () {
    ItemDB.checkInstall();
    ItemDB.registerEventHandlers();
});
