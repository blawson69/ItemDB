/*
ItemDB
Database of D&D 5e items for Roll20 scripts.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l

Like this script? Become a patron:
    https://www.patreon.com/benscripts
*/

var ItemDB = ItemDB || (function () {
    'use strict';

    //---- INFO ----//
    var version = '1.0',
    debugMode = true,
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
        title: 'padding: 0 0 10px 0; color: ##591209; font-size: 1.5em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        subtitle: 'margin-top: -4px; padding-bottom: 4px; color: #666; font-size: 1.125em; font-variant: small-caps;',
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

        log('--> ItemDB v' + version + ' <-- Initialized');
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
							commandShow(msg.content, msg.who);
						}
						break;
					case 'get':
						commandGet(msg.content);
						break;
					case 'add':
                        if (playerIsGM(msg.playerid)) {
                            commandAddDirect(msg);
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

    commandShow = function (cmd, who = 'GM') {
        if (typeof state['ItemDB'].data.name == 'undefined') {
            showDialog('Error', 'Database not found. Please upload an ItemDB database to the API and restart the sandbox.', who);
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
                var attrs = [];
                if (item.attack_ability == 'FIN') attrs.push('Finesse');
                if (item.thrown) attrs.push('Thrown');
                if (item.versatile) attrs.push('Versatile');
                message = '<div style="' + styles.subtitle + '">' + types[item.type] + '</div>*Hit:* ' + (item.attack_damage_dice == 0 ? 'Special. ' : item.attack_damage_dice + item.attack_damage_die + (typeof item.attack_damage_bonus != 'undefined' ? ' + ' +  item.attack_damage_bonus : '') + ' ' + item.attack_damage_type + ' damage. ') + (item.type == 'MELEE_WEAPON' ? '*Reach:* ' + item.reach : '*Range:* ' + item.range);
                if (_.size(attrs) > 0) message += ' *Attributes:* ' + attrs.join() + '.';
                message += ' *Weight:* ' +  item.weight + '.';
            }

            if (item.category == 'armor') {
                var ac = item.ac_base + (typeof item.ac_bonus != 'undefined' ? item.ac_bonus : 0);
                message = '<div style="' + styles.subtitle + '">' + types[item.type] + '</div>*AC:* ' + item.ac_base + (typeof item.ac_bonus != 'undefined' ? ' + ' + item.ac_bonus : '') + (item.ac_ability == 'DEX' ? ' + Dex' : '') + (item.ac_ability == 'DEX_MAX_X' ? ' + Dex (max 2)' : '') + '. ' + (item.stealth ? ' *Stealth:* Disadvantage.' : '') + (item.strength_requirements ? ' *Required minimum Strength:* ' + item.strength_requirements.replace('Str ','')  + '.' : '');
                message += ' *Weight:* ' +  item.weight + '.';
            }

            message += (content != '') ? '<br><br>' + content : content;
            showDialog(item.name, message, who);
        } else {
            showDialog('Error', '"' + item_name + '" not found.', who);
        }
    },

    commandAddDirect = function (msg) {
        var cmd = msg.content;
        if (_.size(msg.selected) == 0) {
            showDialog('Error', 'No tokens selected.', msg.who);
        } else {
            var token = getObj(msg.selected[0]._type, msg.selected[0]._id);
            commandAdd(msg.content, token.get('represents'), true);
        }
    },

    commandAdd = function (cmd, char_id, internal = false) {
        if (typeof state['ItemDB'].data.name == 'undefined') {
            showDialog('Error', 'No database found! Please upload an ItemDB database to the API and restart the sandbox.', who);
            return;
        }

        var item_name = cmd.replace('!idb add', '').trim(), done = {success:false, err: ''};
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
                    done.success = add_Offense(char_id, v_item);
                }

                if (item.thrown) {
                    var r_item = _.clone(item);
                    r_item.type = 'RANGED_WEAPON';
                    r_item.name = item.name + ' (Thrown)';
                    log('Calling add_Offense(\'' + char_id + '\', \'' + r_item.name + '\')');
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
            } else {
                if (!item) done.err += '"' + item_name + '" was not found.';
                if (!char) done.err += ' Invalid character ID "' + char_id + '".';
                done.err = done.err.trim();
                if (internal) showDialog('Error', done.err, 'GM');
            }
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
                //if (e_name.indexOf('Slaying') != -1) e_name = 'Slaying';
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
                attack_type: 'RANGED_WEAPON_ATTACK',
                attack_ability: item.attack_ability,
                proficiency: getProficiencyBonus(char_id, item),
                attack_damage_ability: item.attack_ability,
                crit_range: (item.category == 'weapons' ? 20 : 21),
                attack_damage_dice: item.attack_damage_dice,
                attack_damage_die: item.attack_damage_die,
                attack_damage_type: item.attack_damage_type,
                ammo_field_name: item.ammo_field_name,
                range: item.range,
                attack_damage_average: calcAverage(item),
                weight: item.weight
            };

            // Add ammo for ranged weapons
            var ammo = _.find(_.pluck(state['ItemDB'].data.ammo, 'ammo_field_name'), function (x) {return item.ammo_field_name.indexOf(x) != -1;});
            var newAmmo = {ammo_field_name: item.ammo_field_name, weight: (ammo ? ammo.weight : item.weight)};
            add_Ammo(char_id, newAmmo);
        } else {
            // MELEE_WEAPON
            newItem = {
                name: item.name,
                type: 'MELEE_WEAPON',
                attack_toggle: 1,
                attack_type: 'MELEE_WEAPON_ATTACK',
                attack_ability: item.attack_ability,
                attack_damage_ability: item.attack_ability,
                proficiency: getProficiencyBonus(char_id, item),
                crit_range: (item.category == 'weapons' ? 20 : 21),
                attack_damage_dice: item.attack_damage_dice,
                attack_damage_die: item.attack_damage_die,
                attack_damage_type: item.attack_damage_type,
                reach: item.reach,
                attack_damage_average: calcAverage(item),
                weight: item.weight
            };
        }

        if (typeof item.content != 'undefined') newItem.content = item.content;
        if (typeof item.recharge != 'undefined') newItem.recharge = item.recharge;
        if (typeof item.uses != 'undefined') {
            var n_uses = (item.uses.indexOf('d') != -1) ? rollDice(item.uses) : item.uses;
            newItem.uses = n_uses;
            newItem.per_use = (typeof item.per_use != 'undefined') ? item.per_use : 1;
        }

        if (typeof item.saving_throw_dc != 'undefined') {
            newItem.saving_throw_toggle = '1',
            newItem.saving_throw_dc = item.saving_throw_dc,
            newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
        }

        return processItem(char_id, newItem, 'offense');
    },

    add_Utility = function (char_id, item) {
        var newItem = {
            name: item.name,
            type: (item.type == 'wondrous_items' ? 'WONDROUS_ITEM' : 'ADVENTURING_GEAR'),
            recharge: (typeof item.recharge != 'undefined') ? item.recharge : 'MANUAL',
            content: item.content,
            weight: (typeof item.weight != 'undefined') ? item.weight : 1
        };

        if (typeof item.uses != 'undefined') {
            var n_uses = (item.uses.indexOf('d') != -1) ? rollDice(item.uses) : item.uses;
            newItem.uses = n_uses;
            newItem.per_use = (typeof item.per_use != 'undefined') ? item.per_use : 1;
        } else newItem.uses = 1;

        if (typeof item.saving_throw_dc != 'undefined') {
            newItem.saving_throw_toggle = '1',
            newItem.saving_throw_dc = item.saving_throw_dc,
            newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
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
            weight: item.weight,
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
            var n_uses = (item.uses.indexOf('d') != -1) ? rollDice(item.uses) : item.uses;
            newItem.uses = n_uses;
            newItem.per_use = (typeof item.per_use != 'undefined') ? item.per_use : 1;
        } else newItem.uses = 1;

        if (typeof item.saving_throw_dc != 'undefined') {
            newItem.saving_throw_toggle = '1';
            newItem.saving_throw_dc = item.saving_throw_dc;
            newItem.saving_throw_vs_ability = item.saving_throw_vs_ability;
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
        log('processItem(\'' + char_id + '\', \'' + item.name + '\', \'' + section + '\')');
        var currItemID = findCurrItemID(char_id, item.name, section);
        log('Processing item: ' + JSON.stringify(item));

        // Update uses for existing item
        if (currItemID && typeof item.uses != 'undefined') {
            var tmp_uses = findObjs({ type: 'attribute', characterid: char_id, name: 'repeating_' + section + '_' + currItemID + '_uses' })[0];
            log('tmp_uses = ' + JSON.stringify(tmp_uses));
            tmp_uses.setWithWorker('current', toNumber(tmp_uses.get('current')) + item.uses);
        }

        // Create item if not found or no uses
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
        log('findCurrItemID(\'' + char_id + '\', \'' + item_name + '\', \'' + section + '\')');
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

    calcAverage = function (item) {
        var die = toNumber(item.attack_damage_die),
        n_dice = item.attack_damage_dice,
        bonus = (typeof item.attack_damage_bonus == 'undefined' ? 0 : item.attack_damage_bonus);
        return (Math.floor(die/2) + bonus) * n_dice + Math.floor(n_dice/2);
    },

    rollDice = function (expr) {
        expr = expr.trim().split(/[^\d]+/);
        var dice = parseInt(expr[0]), die = parseInt(expr[1]);
        var bonus = (typeof expr[2] != 'undefined') ? parseInt(expr[2]) : 0;
        var result = bonus;
        for (var x = 0; x < dice; x++) {
            result += randomInteger(die);
        }
        return result;
    },

    getProficiencyBonus = function (char_id, item) {
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

        return prof_bonus;
    },

    toNumber = function (num) {
        var ret;
        if (typeof num == 'string') num = num.replace(/\D*/i, '');
        return Number(num);
    },

    commandConfig = function (msg) {
        var message = '', parms = msg.content.replace('!idb config ', '').split(/\s*\-\-/i);
        if (parms[1]) {
            if (parms[1] == 'toggle-show') state['ItemDB'].playerShow = !state['ItemDB'].playerShow;
            if (parms[1] == 'toggle-off') state['ItemDB'].redirectOffense = !state['ItemDB'].redirectOffense;
            if (parms[1] == 'toggle-util') state['ItemDB'].redirectUtility = !state['ItemDB'].redirectUtility;
        }

        message += '<div style=\'' + styles.title + '\'>Player Access</div>';
        message += 'When turned on, players have access to the "show" command. <div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!idb config --toggle-show"> turn ' + (state['ItemDB'].playerShow ? 'off' : 'on') + '</a></div>';

        message += '<div style=\'' + styles.title + '\'>Offense Redirect</div>';
        message += 'When turned on, Offense Redirect will add relevant items to the Offense section to be used as improvised thrown weapons. Included from the SRD: Acid, Alchemist\'s Fire, Holy Water, Oil. <div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!idb config --toggle-off"> turn ' + (state['ItemDB'].redirectOffense ? 'off' : 'on') + '</a></div>';

        message += '<div style=\'' + styles.title + '\'>Utility Redirect</div>';
        message += 'When turned on, Utility Redirect adds certain Adventuring Gear and Wondrous Items to the Utility section. This list includes Potions, Torches, and other consumable items as well as those with a designated number of uses. <div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!idb config --toggle-util"> turn ' + (state['ItemDB'].redirectUtility ? 'off' : 'on') + '</a></div>';

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

    showShapedDialog = function (title, content, character = '', silent = false) {
		// Outputs a 5e Shaped dialog box to players/characters
        var prefix = '', char_name = '';
        if (silent && character.length != 0) prefix = '/w "' + character + '" ';
        if (character.length != 0) char_name = ' {{show_character_name=1}} {{character_name=' + character + '}}';
        var message = prefix + '&{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}' + char_name;
        sendChat('ItemDB', message, null, {noarchive:true});
	},

    showShapedAdminDialog = function (title, content, character = '') {
		// Whispers a 5e Shaped dialog box to the GM
        if (character != '') character = ' {{show_character_name=1}} {{character_name=' + character + '}}';
        var message = '/w GM &{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}' + character;
        sendChat('ItemDB', message, null, {noarchive:true});
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

    commandListDB = function (msg) {
        var message = '', cmd = msg.content.trim().split(/\s+/);
        if (_.size(cmd) == 3) {
            var page = parseInt(cmd[2]), count = (page == 1 ? 1 : page * 10 - 9);
            for (var x = count; x < (count + 10); ) {
                if (typeof state['ItemDB'].data.wondrous_items[x-1] != 'undefined') {
                    message += x + ' <a style="' + styles.textButton + '" href="!idb show ' + state['ItemDB'].data.wondrous_items[x-1].name + '">' + state['ItemDB'].data.wondrous_items[x-1].name + '</a><br>';
                }
                x++;
            }

            message += '<br><div style="text-align: center;">';
            message += (page == 1) ? '&laquo; prev' : '<a style="' + styles.textButton + '" href="!idb list ' + (page - 1) + '">&laquo; prev</a>';
            message += ' &nbsp;&nbsp; ';
            message += (count < _.size(state['ItemDB'].data.wondrous_items)) ? '<a style="' + styles.textButton + '" href="!idb list ' + (page + 1) + '">next &raquo;</a>' : 'next &raquo;';
            message += '</div>';
        } else {
            _.each(state['ItemDB'].data.wondrous_items, function (item) {
                message += '<a style="' + styles.textButton + '" href="!idb show ' + item.name + '">' + item.name + '<a/><br>';
            });
        }
        showDialog('List', message, 'GM')
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
        show: commandShow,
        add: commandAdd,
        get: commandGet
	};
}());

on("ready", function () {
    ItemDB.checkInstall();
    ItemDB.registerEventHandlers();
});
