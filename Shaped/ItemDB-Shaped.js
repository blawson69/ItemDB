/*
ItemDB
A roll20 database of D&D 5e items for Roll20 scripts.

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
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
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
        if (typeof state['ItemDB'].redirectOffense == 'undefined') state['ItemDB'].redirectOffense = false;
        if (typeof state['ItemDB'].redirectUtility == 'undefined') state['ItemDB'].redirectUtility = false;
        if (typeof state['ItemDB'].addCustom == 'undefined') state['ItemDB'].addCustom = false;

        log('--> ItemDB Shaped v' + version + ' <-- Initialized');
		if (debugMode) {
			var d = new Date();
			showDialog('Debug Mode', 'ItemDB v' + version + ' loaded at ' + d.toLocaleTimeString() + '<br><a style=\'' + styles.textButton + '\' href="!idb config">Show config</a>', 'GM');
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
        var categories = {weapons: 'Weapon', ammo: 'Ammunition', armor: 'Armor', shield: 'Shield', adventuring_gear: 'Adventuring gear', potions: 'Adventuring gear', poisons: 'Adventuring gear', wondrous_items:'Wondrous item'};
        var types = {'MELEE_WEAPON': 'Melee weapon', 'RANGED_WEAPON': 'Ranged weapon', 'LIGHT_ARMOR': 'Light armor', 'MEDIUM_ARMOR': 'Medium armor', 'HEAVY_ARMOR': 'Heavy armor', 'SHIELD':'Shield'};

        var item = commandGet(item_name);
        if (item) {
            var content = (typeof item.content != 'undefined') ? item.content.replace(/\n/g, '<br>') : '';
            var message = '<div style="' + styles.subtitle + '">' + categories[item.category] + '</div>';

            if (item.category == 'weapons') {
                var attrs = getProperties(item);
                message = '<div style="' + styles.subtitle + '">' + types[item.type] + '</div><div style="' + styles.statsWrapper + '">*Hit:* ' + (item.attack_damage_dice == 0 ? 'Special. ' : item.attack_damage_dice + item.attack_damage_die + (typeof item.attack_damage_bonus != 'undefined' ? ' + ' +  item.attack_damage_bonus : '') + ' ' + item.attack_damage_type + ' damage. ') + (item.type == 'MELEE_WEAPON' ? '*Reach:* ' + item.reach : '*Range:* ' + item.range);
                message += ' *Weight:* ' +  item.weight + '.';
                if (attrs != '') message += ' *Properties:* ' + attrs + '.';
                message += '</div>';
            }

            if (item.category == 'armor') {
                message = '<div style="' + styles.subtitle + '">' + types[item.type] + '</div><div style="' + styles.statsWrapper + '">*AC:* ' + item.ac_base + (typeof item.ac_bonus != 'undefined' ? ' + ' + item.ac_bonus : '') + (item.ac_ability == 'DEX' ? ' + Dex' : '') + (item.ac_ability == 'DEX_MAX_X' ? ' + Dex (max 2)' : '') + '. ' + (item.stealth ? ' *Stealth:* Disadvantage.' : '') + (item.strength_requirements ? ' *Required minimum Strength:* ' + item.strength_requirements.replace('Str ','')  + '.' : '');
                message += ' *Weight:* ' +  item.weight + '.</div>';
            }

            if (internal) showDialog(item.name, message + content, who);
            else return {title: item.name, desc: message + content};
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
        var done = {success:false, err: ''};
        if (typeof state['ItemDB'].data.name == 'undefined') {
            if (internal) showDialog('Error', 'No database found! Please upload an ItemDB database to the API and restart the sandbox.', who);
            else done.err += 'No database found! Please upload an ItemDB database to the API and restart the sandbox.';
            return done;
        }

        var item_name = cmd.replace('!idb add', '').trim();
        var item = commandGet(item_name);
        var char = getObj('character', char_id);
        if (item && char) {
            if (item.category == 'weapons' || (typeof item.section != 'undefined' && item.section == 'offense' && state['ItemDB'].redirectOffense)) {
                if (typeof item.type == 'undefined') item.type = 'RANGED_WEAPON';
                done.success = add_Offense(char_id, item);

                if (item.versatile) {
                    var v_item = _.clone(item);
                    v_item.name = item.name + ' (Versatile)';
                    v_item.attack_damage_die = getVersatile(item.attack_damage_die);
                    v_item.weight = 0; // Don't encumber unnecessarily
                    done.success = add_Offense(char_id, v_item);
                }

                if (item.thrown) {
                    var r_item = _.clone(item);
                    r_item.type = 'RANGED_WEAPON';
                    r_item.name = item.name + ' (Thrown)';
                    r_item.weight = 0; // Don't encumber unnecessarily
                    done.success = add_Offense(char_id, r_item);
                }
            } else if (typeof item.section != 'undefined' && item.section == 'utility' && state['ItemDB'].redirectUtility) done.success = add_Utility(char_id, item);
            else if (item.category == 'armor')  done.success = add_Armor(char_id, item);
            else if (item.category == 'ammo') done.success = add_Ammo(char_id, item);
            else done.success = add_Equip(char_id, item);

            if (done.success) {
                if (internal) {
                    showDialog('Item Added', item.name + ' was added to your inventory.', char.get('name'));
                    showDialog('', item.name + ' was added to ' + char.get('name') + '\'s inventory.', 'GM');
                }
            }
        }

        if (!done.success) {
            if (!item) done.err.push('"' + item_name + '" was not found.');
            if (!char) done.err.push('Character not selected or invalid character ID "' + char_id + '".');
            if (internal) showDialog('Error', done.err.join('<br>'), 'GM');
        }

        return done;
    },

    commandGet = function (item_name) {
        var item_name = item_name.replace('!idb get', '').trim(), item;
        if (state['ItemDB'].data == {}) {
            return item;
        }

        // AMMO
        if (_.find(_.pluck(state['ItemDB'].data.ammo, 'name'), function (x) {return item_name.indexOf(x) != -1;})) {
            item = _.clone(_.find(state['ItemDB'].data.ammo, function (x) { return item_name.indexOf(x.name) != -1; }));

            if (item && item.name !== item_name) {
                var base_name = item.name, e_name = item_name.replace(base_name, '').trim();
                var enchantment = _.clone(_.find(state['ItemDB'].data.ammo_enchantments, function (x) {return e_name.indexOf(x.name) != -1;}));

                if (item && enchantment) {
                    var w_content = (typeof item.content == 'undefined') ? '' : item.content,
                    e_content = enchantment.content, combo_content;
                    if (e_content.indexOf('Curse.') != -1) combo_content = e_content + (w_content != '' ? w_content + '\n\n' : '');
                    else combo_content = (w_content != '' ? w_content + '\n\n' : '') + e_content;
                    Object.keys(enchantment).forEach(function (field) {
                        item[field] = enchantment[field];
                    });
                    item.category = 'ammo';
                    item.name = item_name;
                    item.content = combo_content;
                }
            }

        // WEAPONS
        } else if (_.find(_.pluck(state['ItemDB'].data.magic_weapons, 'name'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.magic_weapons, function (x) {return x.name == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.weapons, 'name'), function (x) {return item_name.indexOf(x) != -1;})) {
            item = _.clone(_.find(state['ItemDB'].data.weapons, function (x) { return item_name.indexOf(x.name) != -1; }));

            if (item && item.name !== item_name) {
                var base_name = item.name, e_name = item_name.replace(base_name, '').trim();
                var enchantment = _.clone(_.find(state['ItemDB'].data.weapon_enchantments, function (x) {return e_name.indexOf(x.name) != -1;}));

                if (item && enchantment) {
                    var w_content = (typeof item.content == 'undefined') ? '' : item.content,
                    e_content = enchantment.content, combo_content;
                    if (e_content.indexOf('Curse.') != -1) combo_content = e_content + (w_content != '' ? w_content + '\n\n' : '');
                    else combo_content = (w_content != '' ? w_content + '\n\n' : '') + e_content;
                    Object.keys(enchantment).forEach(function (field) {
                        item[field] = enchantment[field];
                    });
                    item.category = 'weapons';
                    item.name = item_name;
                    item.content = combo_content;
                }
            }

        // ARMOR
        } else if (_.find(_.pluck(state['ItemDB'].data.magic_armor, 'name'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.magic_armor, function (x) {return x.name == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.armor, 'name'), function (x) {return item_name.indexOf(x) != -1;})) {
            item = _.clone(_.find(state['ItemDB'].data.armor, function (x) { return item_name.indexOf(x.name) != -1; }));

            if (item && item.name !== item_name) {
                var base_name = item.name, e_name = item_name.replace(base_name, '').trim();
                var enchantment = _.clone(_.find(state['ItemDB'].data.armor_enchantments, function (x) {return e_name.indexOf(x.name) != -1;}));

                if (item && enchantment) {
                    var w_content = (typeof item.content == 'undefined') ? '' : item.content,
                    e_content = enchantment.content, combo_content;
                    if (e_content.indexOf('Curse.') == -1) combo_content = e_content + (w_content != '' ? '\n\n' + w_content : '');
                    else combo_content = (w_content != '' ? w_content + '\n\n' : '') + e_content;
                    if (e_name == 'Mithril') {
                        delete item.stealth;
                        delete item.strength_requirements;
                    }
                    Object.keys(enchantment).forEach(function (field) {
                        item[field] = enchantment[field];
                    });
                    item.category = 'armor';
                    item.name = item_name;
                    item.content = combo_content;
                }
            }

        } else if (_.find(_.pluck(state['ItemDB'].data.adv_gear, 'name'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.adv_gear, function (x) {return x.name == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.potions, 'name'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.potions, function (x) {return x.name == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.poisons, 'name'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.poisons, function (x) {return x.name == item_name;});
        } else if (_.find(_.pluck(state['ItemDB'].data.wondrous_items, 'name'), function (x) {return x == item_name;})) {
            item = _.find(state['ItemDB'].data.wondrous_items, function (x) {return x.name == item_name;});
        }else if (state['ItemDB'].addCustom) {
            item = {category:"adventuring_gear", name:item_name, weight:1, content:"Unknown item."};
        }

        return (typeof item != 'undefined') ? _.clone(item) : item;
    },

    add_Offense = function (char_id, item) {
        var newItem;
        if (item.type == 'RANGED_WEAPON') {
            newItem = {
                name: item.name,
                type: 'RANGED_WEAPON',
                attack_toggle: 1,
                toggle_details: 0,
                attack_type: 'RANGED_WEAPON_ATTACK',
                proficiency: getProficiency(char_id, item),
                crit_range: (typeof item.crit_range != 'undefined' ? item.crit_range : 20),
                attack_damage_dice: item.attack_damage_dice,
                attack_damage_die: item.attack_damage_die,
                attack_damage_type: item.attack_damage_type,
                attack_ability: item.attack_ability,
                attack_damage_ability: item.attack_damage_ability,
                range: item.range,
                weight: item.weight
            };

            // Add ammo for normal ranged weapons
            if (typeof item.ammo_field_name != 'undefined') {
                newItem.ammo_field_name = item.ammo_field_name;
                var ammo = _.find(_.pluck(state['ItemDB'].data.ammo, 'ammo_field_name'), function (x) {return item.ammo_field_name.indexOf(x) != -1;});
                var newAmmo = {ammo_field_name: item.ammo_field_name, weight: (ammo ? ammo.weight : item.weight)};
                add_Ammo(char_id, newAmmo);
            }
        } else {
            newItem = {
                name: item.name,
                type: 'MELEE_WEAPON',
                attack_toggle: 1,
                toggle_details: 0,
                attack_type: 'MELEE_WEAPON_ATTACK',
                proficiency: getProficiency(char_id, item),
                crit_range: (typeof item.crit_range != 'undefined' ? item.crit_range : 20),
                attack_damage_dice: item.attack_damage_dice,
                attack_damage_die: item.attack_damage_die,
                attack_damage_type: item.attack_damage_type,
                attack_ability: item.attack_ability,
                attack_damage_ability: item.attack_damage_ability,
                reach: item.reach,
                weight: item.weight
            };
        }

        if (typeof item.content != 'undefined') newItem.content = item.content;
        if (typeof item.recharge != 'undefined') newItem.recharge = item.recharge;
        if (typeof item.uses != 'undefined') {
            var n_uses = (typeof item.uses == 'string' && item.uses.indexOf('d') != -1) ? rollDice(item.uses) : item.uses;
            newItem.uses = n_uses;
            newItem.per_use = (typeof item.per_use != 'undefined') ? item.per_use : 1;
        }

        if (typeof item.attack_bonus != 'undefined') newItem.attack_bonus = item.attack_bonus;
        if (typeof item.attack_damage_bonus != 'undefined') newItem.attack_damage_bonus = item.attack_damage_bonus;

        if (typeof item.saving_throw_dc != 'undefined') {
            newItem.saving_throw_toggle = '1',
            newItem.saving_throw_dc = item.saving_throw_dc,
            newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
            if (typeof item.saving_throw_attack_damage_dice != 'undefined') {
                newItem.saving_throw_attack_damage_dice = item.saving_throw_attack_damage_dice;
                newItem.saving_throw_attack_damage_die = item.saving_throw_attack_damage_die;
                newItem.saving_throw_damage_type = item.saving_throw_damage_type;

            }
        }

        return processItem(char_id, newItem, 'offense');
    },

    add_Utility = function (char_id, item) {
        log('add_Utility: ' + JSON.stringify(item));
        var newItem = {
            name: item.name,
            toggle_details: 0,
            type: (item.type == 'wondrous_items' ? 'WONDROUS_ITEM' : 'ADVENTURING_GEAR'),
            recharge: (typeof item.recharge != 'undefined') ? item.recharge : 'MANUAL',
            content: item.content,
            weight: (typeof item.weight != 'undefined') ? item.weight : 1
        };

        if (typeof item.uses != 'undefined') {
            var n_uses = (typeof item.uses == 'string' && item.uses.indexOf('d') != -1) ? rollDice(item.uses) : item.uses;
            newItem.uses = n_uses;
            newItem.per_use = (typeof item.per_use != 'undefined') ? item.per_use : 1;
        } else newItem.uses = 1;

        if (typeof item.saving_throw_dc != 'undefined') {
            newItem.saving_throw_toggle = '1',
            newItem.saving_throw_dc = item.saving_throw_dc,
            newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
            if (typeof item.saving_throw_attack_damage_dice != 'undefined') {
                newItem.saving_throw_attack_damage_dice = item.saving_throw_attack_damage_dice;
                newItem.saving_throw_attack_damage_die = item.saving_throw_attack_damage_die;
                newItem.saving_throw_damage_type = item.saving_throw_damage_type;

            }
        }

        if (typeof item.heal_die != 'undefined') {
            newItem.heal_toggle = '1',
            newItem.heal_die = item.heal_die,
            newItem.heal_dice = item.heal_dice,
            newItem.heal_bonus = item.heal_bonus;
        }

        return processItem(char_id, newItem, 'utility');
    },

    add_Armor = function (char_id, item) {
        var newItem = {
            name: item.name,
            type: item.type,
            toggle_details: 0,
            ac_base: item.ac_base,
            weight: item.weight,
        };

        if (typeof item.content != 'undefined') newItem.content = item.content;
        if (typeof item.stealth != 'undefined') newItem.stealth = item.stealth;
        if (typeof item.ac_ability != 'undefined') newItem.ac_ability = item.ac_ability;
        if (typeof item.ac_bonus != 'undefined') newItem.ac_bonus = item.ac_bonus;

        return processItem(char_id, newItem, 'armor');
    },

    add_Ammo = function (char_id, item) {
        var newItem = {
            name: item.ammo_field_name,
            weight: (item.weight) ? item.weight : 1,
            uses: (typeof item.uses != 'undefined') ? item.uses : 1,
        };

        return processItem(char_id, newItem, 'ammo');
    },

    add_Equip = function (char_id, item) {
        var newItem = {
            name: item.name,
            content: item.content,
            type: 'ADVENTURING_GEAR',
            weight: (typeof item.weight != 'undefined') ? item.weight : 1,
            toggle_details: 0
        };

        if (typeof item.recharge != 'undefined') newItem.recharge = item.recharge;
        if (typeof item.uses != 'undefined') {
            var n_uses = (typeof item.uses == 'string' && item.uses.indexOf('d') != -1) ? rollDice(item.uses) : item.uses;
            newItem.uses = n_uses;
            newItem.per_use = (typeof item.per_use != 'undefined') ? item.per_use : 1;
        } else newItem.uses = 1;

        if (typeof item.saving_throw_dc != 'undefined') {
            newItem.saving_throw_toggle = '1';
            newItem.saving_throw_dc = item.saving_throw_dc;
            newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
            if (typeof item.saving_throw_attack_damage_dice != 'undefined') {
                newItem.saving_throw_attack_damage_dice = item.saving_throw_attack_damage_dice;
                newItem.saving_throw_attack_damage_die = item.saving_throw_attack_damage_die;
                newItem.saving_throw_damage_type = item.saving_throw_damage_type;

            }
        }

        if (typeof item.heal_dice != 'undefined') {
            newItem.heal_toggle = '1',
            newItem.heal_dice = item.heal_dice;
            newItem.heal_die = item.heal_die;
            newItem.heal_bonus = item.heal_bonus;
        }

        return processItem(char_id, newItem, 'equipment');
    },

    processItem = function (char_id, item, section) {
        var currItemID = findCurrItemID(char_id, item.name, section);

        // Update uses for existing item with uses
        if (currItemID && typeof item.uses != 'undefined') {
            var tmp_uses = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_' + section + '_' + currItemID + '_uses' })[0];
            tmp_uses.setWithWorker('current', toNumber(tmp_uses.get('current')) + item.uses);
        }

        // Create item if not found
        if (!currItemID) {
            const data = {};
            var RowID = generateRowID();
            var repString = 'repeating_' + section + '_' + RowID;
            Object.keys(item).forEach(function (field) {
                data[repString + '_' + field] = item[field];
            });
            setAttrs(char_id, data);
        }
        return true;
    },

    findCurrItemID = function(char_id, item_name, section) {
        var row_id, re = new RegExp('^repeating_' + section + '_.*_name$', 'i');
        var items = _.filter(findObjs({type: 'attribute', characterid: char_id}, {caseInsensitive: true}), function (x) { return x.get('name').match(re) !== null; });
        var item = _.find(items, function (i) { return (i.get('current').replace(/\W/, '') == item_name.replace(/\W/, '')); });
        if (item) row_id = item.get('name').split('_')[2];
        return row_id;
    },

    getVersatile = function (die) {
        var vd = (die == 'd4' ? 'd6': (die == 'd6' ? 'd8' : (die == 'd8' ? 'd10' : 'd12')));
        return vd;
    },

    getProperties = function (item) {
        var props = [];
        if (item.type == 'RANGED_WEAPON' && typeof item.thrown == 'undefined') props.push('Ammunition');
        if (item.attack_ability == 'FIN') props.push('Finesse');
        if (typeof item.heavy != 'undefined') props.push('Heavy');
        if (typeof item.light != 'undefined') props.push('Light');
        if (typeof item.loading != 'undefined') props.push('Loading');
        if (typeof item.reach != 'undefined' && item.reach != '5 ft.') props.push('Reach');
        if (typeof item.special != 'undefined') props.push('Special');
        if (typeof item.thrown != 'undefined') props.push('Thrown');
        if (typeof item.two_handed != 'undefined') props.push('Two-Handed');
        if (typeof item.versatile != 'undefined') props.push('Versatile (' + item.attack_damage_dice + getVersatile(item.attack_damage_die) + ')');
        return props.join(', ');
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

    getProficiency = function (char_id, item) {
        var prof_bonus = getAttrByName(char_id, 'pb');
        var profs = getAttrByName(char_id, 'proficiencies');
        var item_class = (typeof item.class != 'undefined') ? item.class : 'improvised';
        var item_name = item.name.replace(/\s\((Thrown|Versatile)\)/i, '');

        if (item_class == 'improvised') {
            var re = new RegExp('^repeating_feat_.*_content$', 'i');
            var feats = _.filter(findObjs({type: 'attribute', characterid: char_id}, {caseInsensitive: true}), function (x) { return x.get('name').match(re) !== null; });
            if (!_.find(feats, function (i) { return (i.get('current').search(/Improvised\sWeapons/i) > -1); })) prof_bonus = 0;
        } else {
            var re1 = new RegExp('.*' + item_class + ' weapons.*', 'gi');
            var re2 = new RegExp('.*' + item_name + 's.*', 'gi');
            if (profs.match(re1) == null && profs.match(re2) == null && profs.search('All weapons') == -1) prof_bonus = 0;
        }

        return (prof_bonus != 0) ? 'on' : 0;
    },

    toNumber = function (num) {
        if (typeof num == 'string') num = num.replace(/\D+/gi, '');
        return Number(num);
    },

    commandConfig = function (msg) {
        var message = '', parms = msg.content.replace('!idb config ', '').split(/\s*\-\-/i);
        if (parms[1]) {
            if (parms[1] == 'toggle-show') state['ItemDB'].playerShow = !state['ItemDB'].playerShow;
            if (parms[1] == 'toggle-off') state['ItemDB'].redirectOffense = !state['ItemDB'].redirectOffense;
            if (parms[1] == 'toggle-util') state['ItemDB'].redirectUtility = !state['ItemDB'].redirectUtility;
            if (parms[1] == 'toggle-add') state['ItemDB'].addCustom = !state['ItemDB'].addCustom;
        }

        message += '<div style=\'' + styles.title + '\'>Player Access</div>';
        message += '<a style="' + styles.textButton + '" href="!idb config --toggle-show" title="' + (state['ItemDB'].playerShow ? 'Turn off' : 'Turn on') + '">' + (state['ItemDB'].playerShow ? '✅' : '❎') + '</a> Players ' + (state['ItemDB'].playerShow ? '' : 'do not') + ' have access to the "show" command.<br><br>';

        message += '<div style=\'' + styles.title + '\'>Offense Redirect</div>';
        message += '<a style="' + styles.textButton + '" href="!idb config --toggle-off" title="' + (state['ItemDB'].redirectOffense ? 'Turn off' : 'Turn on') + '">' + (state['ItemDB'].redirectOffense ? '✅' : '❎') + '</a> Relevant items will ' + (state['ItemDB'].redirectOffense ? '' : 'not') + ' be added to the Offense section for use as improvised thrown weapons. Included from the SRD: Acid, Alchemist\'s Fire, Holy Water, Oil. <br><br>';

        message += '<div style=\'' + styles.title + '\'>Utility Redirect</div>';
        message += '<a style="' + styles.textButton + '" href="!idb config --toggle-util" title="' + (state['ItemDB'].redirectUtility ? 'Turn off' : 'Turn on') + '">' + (state['ItemDB'].redirectUtility ? '✅' : '❎') + '</a> Certain Adventuring Gear and Wondrous Items will ' + (state['ItemDB'].redirectUtility ? '' : 'not') + ' be added to the Utility section. This list includes Potions, Torches, and other consumable items as well as those with a designated number of uses. <br><br>';

        message += '<div style=\'' + styles.title + '\'>Unknown Items</div>';
        message += '<a style="' + styles.textButton + '" href="!idb config --toggle-add" title="' + (state['ItemDB'].addCustom ? 'Turn off' : 'Turn on') + '">' + (state['ItemDB'].addCustom ? '✅' : '❎') + '</a> Items not present in the database will ' + (state['ItemDB'].addCustom ? '' : 'not') + ' be shown/added as adventuring gear with a "Unknown item" description instead displaying an error.';

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
        var res = {err: false, msg: '', count: 0};
        if (typeof state['ItemDB'].data.name == 'undefined') {
            state['ItemDB'].data = {name: 'ItemDB Data', version: version, weapons:[], magic_weapons: [], weapon_enchantments: [], ammo:[], ammo_enchantments:[], armor:[], magic_armor:[], armor_enchantments:[], adv_gear:[], potions:[], poisons:[], wondrous_items:[] };
        }

        if (typeof data.name != 'undefined' && data.name.indexOf('ItemDB') != -1) {
            if (typeof data.weapons == 'object') {
                res.count += _.size(data.weapons);
                _.each(data.weapons, function(weapon) {
                    state['ItemDB'].data.weapons = _.reject(state['ItemDB'].data.weapons, function(x) {return x.name == weapon.name});
                    state['ItemDB'].data.weapons.push(weapon);
                });
                state['ItemDB'].data.weapons = _.uniq(state['ItemDB'].data.weapons);
            }
            if (typeof data.magic_weapons == 'object') {
                res.count += _.size(data.magic_weapons);
                _.each(data.magic_weapons, function(item) {
                    state['ItemDB'].data.magic_weapons = _.reject(state['ItemDB'].data.magic_weapons, function(x) {return x.name == item.name});
                    state['ItemDB'].data.magic_weapons.push(item);
                });
                state['ItemDB'].data.magic_weapons = _.uniq(state['ItemDB'].data.magic_weapons);
            }
            if (typeof data.weapon_enchantments == 'object') {
                res.count += _.size(data.weapon_enchantments);
                _.each(data.weapon_enchantments, function(item) {
                    state['ItemDB'].data.weapon_enchantments = _.reject(state['ItemDB'].data.weapon_enchantments, function(x) {return x.name == item.name});
                    state['ItemDB'].data.weapon_enchantments.push(item);
                });
                state['ItemDB'].data.weapon_enchantments = _.uniq(state['ItemDB'].data.weapon_enchantments);
            }
            if (typeof data.ammo == 'object') {
                res.count += _.size(data.ammo);
                _.each(data.ammo, function(item) {
                    state['ItemDB'].data.ammo = _.reject(state['ItemDB'].data.ammo, function(x) {return x.name == item.name});
                    state['ItemDB'].data.ammo.push(item);
                });
                state['ItemDB'].data.ammo = _.uniq(state['ItemDB'].data.ammo);
            }
            if (typeof data.ammo_enchantments == 'object') {
                res.count += _.size(data.ammo_enchantments);
                _.each(data.ammo_enchantments, function(item) {
                    state['ItemDB'].data.ammo_enchantments = _.reject(state['ItemDB'].data.ammo_enchantments, function(x) {return x.name == item.name});
                    state['ItemDB'].data.ammo_enchantments.push(item);
                });
                state['ItemDB'].data.ammo_enchantments = _.uniq(state['ItemDB'].data.ammo_enchantments);
            }
            if (typeof data.armor == 'object') {
                res.count += _.size(data.armor);
                _.each(data.armor, function(item) {
                    state['ItemDB'].data.armor = _.reject(state['ItemDB'].data.armor, function(x) {return x.name == item.name});
                    state['ItemDB'].data.armor.push(item);
                });
                state['ItemDB'].data.armor = _.uniq(state['ItemDB'].data.armor);
            }
            if (typeof data.magic_armor == 'object') {
                res.count += _.size(data.magic_armor);
                _.each(data.magic_armor, function(item) {
                    state['ItemDB'].data.magic_armor = _.reject(state['ItemDB'].data.magic_armor, function(x) {return x.name == item.name});
                    state['ItemDB'].data.magic_armor.push(item);
                });
                state['ItemDB'].data.magic_armor = _.uniq(state['ItemDB'].data.magic_armor);
            }
            if (typeof data.armor_enchantments == 'object') {
                res.count += _.size(data.armor_enchantments);
                _.each(data.armor_enchantments, function(item) {
                    state['ItemDB'].data.armor_enchantments = _.reject(state['ItemDB'].data.armor_enchantments, function(x) {return x.name == item.name});
                    state['ItemDB'].data.armor_enchantments.push(item);
                });
                state['ItemDB'].data.armor_enchantments = _.uniq(state['ItemDB'].data.armor_enchantments);
            }
            if (typeof data.adv_gear == 'object') {
                res.count += _.size(data.adv_gear);
                _.each(data.adv_gear, function(item) {
                    state['ItemDB'].data.adv_gear = _.reject(state['ItemDB'].data.adv_gear, function(x) {return x.name == item.name});
                    state['ItemDB'].data.adv_gear.push(item);
                });
                state['ItemDB'].data.adv_gear = _.uniq(state['ItemDB'].data.adv_gear);
            }
            if (typeof data.potions == 'object') {
                res.count += _.size(data.potions);
                _.each(data.potions, function(item) {
                    state['ItemDB'].data.potions = _.reject(state['ItemDB'].data.potions, function(x) {return x.name == item.name});
                    state['ItemDB'].data.potions.push(item);
                });
                state['ItemDB'].data.potions = _.uniq(state['ItemDB'].data.potions);
            }
            if (typeof data.poisons == 'object') {
                res.count += _.size(data.poisons);
                _.each(data.poisons, function(item) {
                    state['ItemDB'].data.poisons = _.reject(state['ItemDB'].data.poisons, function(x) {return x.name == item.name});
                    state['ItemDB'].data.poisons.push(item);
                });
                state['ItemDB'].data.poisons = _.uniq(state['ItemDB'].data.poisons);
            }
            if (typeof data.wondrous_items == 'object') {
                res.count += _.size(data.wondrous_items);
                _.each(data.wondrous_items, function(item) {
                    state['ItemDB'].data.wondrous_items = _.reject(state['ItemDB'].data.wondrous_items, function(x) {return x.name == item.name});
                    state['ItemDB'].data.wondrous_items.push(item);
                });
                state['ItemDB'].data.wondrous_items = _.uniq(state['ItemDB'].data.wondrous_items);
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
