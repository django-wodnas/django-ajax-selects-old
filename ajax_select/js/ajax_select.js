/* requires RelatedObjects.js */

function didAddPopup(win, newId, newRepr) {
    var name = windowname_to_id(win.name);
    $("#" + name).trigger('didAddPopup', [
			html_unescape(newId),
			html_unescape(newRepr)]);
    win.close();
}

var ajax_select_inlines_single = {};
var ajax_select_inlines_multiple = {};

function ajaxSelectInlineAddedSingle(row) {
	var this_row_id = $(row).attr('id');
	var matches = this_row_id.match(/^([0-9a-z_]+)-(\d+)$/i, '$1');
	if (!matches) return;
	var this_row_name = matches[1];
	var this_row_idx = matches[2];
	var this_match = new RegExp('^id_' + this_row_name + '-__prefix__-', 'i');
	for (var candidate in ajax_select_inlines_single) {
		if (this_match.exec(candidate)) {
			var new_element = candidate.replace('__prefix__', this_row_idx);
			ajaxSelectRegisterSingle(new_element,
					ajax_select_inlines_single[candidate]);
		}
	}
}

function ajaxSelectInlineAddedMultiple(row) {
	var this_row_id = $(row).attr('id');
	var matches = this_row_id.match(/^([0-9a-z_]+)-(\d+)$/i, '$1');
	if (!matches) return;
	var this_row_name = matches[1];
	var this_row_idx = matches[2];
	var this_match = new RegExp('^id_' + this_row_name + '-__prefix__-', 'i');
	for (var candidate in ajax_select_inlines_multiple) {
		if (this_match.exec(candidate)) {
			var new_element = candidate.replace('__prefix__', this_row_idx);
			ajaxSelectRegisterMultiple(new_element,
					ajax_select_inlines_multiple[candidate], []);
		}
	}
}

function ajaxSelectIsInline(html_id) {
	if (html_id.match(/^id_[0-9a-z_]+-__prefix__-[0-9a-z_]+$/i))
		return true;
	return false;
}

function ajaxSelectRegisterSingleInline(html_id, lookup_url) {
	if (typeof(ajax_select_inlines_single[html_id]) != 'undefined')
		return;
	ajax_select_inlines_single[html_id] = lookup_url;
}

function ajaxSelectRegisterMultipleInline(html_id, lookup_url) {
	if (typeof(ajax_select_inlines_multiple[html_id]) != 'undefined')
		return;
	ajax_select_inlines_multiple[html_id] = lookup_url;
}

function ajaxSelectRegisterSingle(html_id, lookup_url) {
	if (ajaxSelectIsInline(html_id)) {
		ajaxSelectRegisterSingleInline(html_id, lookup_url);
		return;
	}

	var killResult = function() {
		$('#' + html_id).val('');
		$('#' + html_id + '_on_deck').children().fadeOut(1.0).remove();
	};

	var receiveResult = function(event, data) {
		var prev = $('#' + html_id).val();
		if (prev) {
			killResult(prev);
		}
		$('#' + html_id).val(data[0]);
		$('#' + html_id + '_text').val('');
		addKiller(data[1], data[0]);
		$('#' + html_id + '_on_deck').trigger('added');
	};

	var addKiller = function(repr, id) {
		var killHtml = '<span class="iconic" id="kill_' + html_id + '">X</span>';
		if (repr){
			$('#' + html_id + '_on_deck').empty();
			$('#' + html_id + '_on_deck').append('<div>' + killHtml + repr + '</div>');
		} else {
			$('#' + html_id + '_on_deck > div').prepend(killHtml);
		}
		$('#kill_' + html_id).click(function() { return function() {
			killResult();
			$('#' + html_id + '_on_deck').trigger("killed");
		}}());
	};

	$('#' + html_id + '_text').autocomplete(lookup_url, {
		width: 320,
		formatItem: function(row) { return row[2]; },
		formatResult: function(row) { return row[1]; },
		dataType: "text"
	}).result(receiveResult);

	if ($('#' + html_id).val()) { // add X for initial value if any
		addKiller(null, $('#' + html_id).val());
	}

	$('#' + html_id).bind('didAddPopup', function(event, id, repr) {
		receiveResult(null, [id, repr]);
	});
}

function ajaxSelectRegisterMultiple(html_id, lookup_url, current_reprs) {
	if (ajaxSelectIsInline(html_id)) {
		ajaxSelectRegisterMultipleInline(html_id, lookup_url);
		return;
	}

	var receiveResult = function(event, data) {
		var id = data[0];
		if ($('#' + html_id).val().indexOf("|" + id + "|") == -1) {
			if ($('#' + html_id).val() == '') {
				$('#' + html_id).val('|');
			}
			$('#' + html_id).val($('#' + html_id).val() + id + '|');
			addKiller(data[1], id);
			$('#' + html_id + '_text').val('');
			$('#' + html_id + '_on_deck').trigger('added');
		} else {
			$('#' + html_id + '_text').val('');
		}
	};

	var addKiller = function(repr, id) {
		var killer_id = 'kill_' + html_id + id
		var killHtml = '<span class="iconic" id="' + killer_id + '">X</span>';
		$('#' + html_id + '_on_deck').append('<div id="' + html_id + '_on_deck_' + id + '">' + killHtml + repr + '</div>');
		$("#" + killer_id).click(function(frozen_id) { return function() {
			// send signal to enclosing p, you may register for this event
			killResult(frozen_id);
			$('#' + html_id + '_on_deck').trigger('killed');
		}}(id));
	};

	var killResult = function(id) {
		$('#' + html_id).val($('#' + html_id).val().replace('|' + id + '|', '|'));
		$('#' + html_id + '_on_deck_' + id).fadeOut().remove();
	};

	$('#' + html_id + '_text').autocomplete(lookup_url, {
		width: 320,
		multiple: true,
		multipleSeparator: " ",
		scroll: true,
		scrollHeight:  300,
		formatItem: function(row) { return row[2]; },
		formatResult: function(row) { return row[1]; },
		dataType: "text"
	}).result(receiveResult);

	$.each(current_reprs, function(i, its) {
		addKiller(its[0], its[1]);
	});

	$('#' + html_id).bind('didAddPopup', function(event, id, repr) {
		receiveResult(null, [id, repr]);
	});
}
