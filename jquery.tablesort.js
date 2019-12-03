/*
	A simple, lightweight jQuery plugin for creating sortable tables.
	https://github.com/kylefox/jquery-tablesort
	Version 0.0.12
*/

(function($) {

	function loadCssCode(code){
		var style = document.createElement('style');
		    style.type = 'text/css';
		    style.rel = 'stylesheet';
	    try{
	        //for Chrome Firefox Opera Safari
	        style .appendChild(document.createTextNode(code));
	    } catch(ex) {
	        //for IE
	        style.styleSheet.cssText = code;
	    }
	    var head = document.getElementsByTagName('head')[0];
	    head.appendChild(style);
	}

	loadCssCode([
		'th,td{border:1px solid #999;padding:5px 2px;}th{cursor: default;}',
		'th.sortable:after{content:" \\2193\\2191";}',
		'th.sortable.asc:after{content:" \\2191";}',
		'th.sortable.desc:after{content:" \\2193";}',
	].join(''));

	$.tablesort = function ($table, settings) {
		var self = this;
		this.$table = $table;
		this.$thead = this.$table.find('thead');
		this.settings = $.extend({}, $.tablesort.defaults, settings);
		this.$sortCells = this.$thead.length > 0 ? this.$thead.find('th.sortable') : this.$table.find('th.sortable');
		this.$sortCells.on('click.tablesort', function() {
			if (self.$sorting) {
				return false
			} else {
				self.$sorting = 1
				// must make a dlay，or the tablesort:start event will delay
				var start = new Date()
				var curTh = $(this)

				curTh.css('transform', 'scale(0.95)');

				// `tablesort:start` callback. Also avoids locking up the browser too much.
				self.$table.trigger('tablesort:start', [self]);
				// click on a different column
				if (self.index !== curTh.index()) {
					self.direction = 'asc';
					self.index = curTh.index();
				} else {
					self.direction = self.direction === 'asc' ? 'desc' : 'asc';
				}

				self.$sortCells.removeClass('asc desc');

				curTh.addClass(self.direction);

				// Try to force a browser redraw
				self.$table.css("display");

				setTimeout(function() {
					curTh.css('transform', 'scale(1)');
					self.sort(curTh);
					self.log('Sort finished in ' + ((new Date()).getTime() - start.getTime()) + 'ms');
					self.$table.trigger('tablesort:complete', [self]);
					self.$sorting = 0
				}, 100)
			}
		});
		this.$th = null;
		this.index = null;
		this.direction = null;
		this.$sorting = 0;
	};

	$.tablesort.prototype = {

		sort: function(th, direction) {

			var self = this,
				table = this.$table,
				rowsContainer = table.find('tbody').length > 0 ? table.find('tbody') : table,
				rows = rowsContainer.find('tr').has('td, th'),
				cells = rows.find(':nth-child(' + (th.index() + 1) + ')').filter('td, th'),
				sortBy = th.data().sortBy,
				sortedMap = [];

			var unsortedValues = cells.map(function(idx, cell) {
				if (sortBy) {
					return (typeof sortBy === 'function') ? sortBy($(th), $(cell), self) : sortBy;
				} else {
					var value = ($(this).data().sortValue != null ? $(this).data().sortValue : $(this).text());
					if (th.hasClass('number')) {
						return parseFloat(value, 10);
					} else {
						return value;
					}
				}
			});

			if (unsortedValues.length === 0) {
				return false;
			}

			self.log("Sorting by " + this.index + ' ' + this.direction);
			direction = this.direction == 'asc' ? 1 : -1;
			for (var i = 0, length = unsortedValues.length; i < length; i++) {
				sortedMap.push({
					index: i,
					cell: cells[i],
					row: rows[i],
					value: unsortedValues[i]
				});
			}

			// Run sorting asynchronously on a timeout to force browser redraw after
			sortedMap.sort(function(a, b) {
				return self.settings.compare(a.value, b.value) * direction;
			});

			$.each(sortedMap, function(i, entry) {
				rowsContainer.append(entry.row);
			});
		},

		log: function(msg) {
			if(($.tablesort.DEBUG || this.settings.debug) && console && console.log) {
				console.log('[tablesort] ' + msg);
			}
		},

		destroy: function() {
			this.$sortCells.off('click.tablesort');
			this.$table.data('tablesort', null);
			return null;
		}
	};

	$.tablesort.DEBUG = false;

	$.tablesort.defaults = {
		debug: $.tablesort.DEBUG,
		compare: function(a, b) {
			if (a > b) {
				return 1;
			} else if (a < b) {
				return -1;
			} else {
				return 0;
			}
		}
	};

	$.fn.tablesort = function(settings) {
		var table, sortable, previous;
		return this.each(function() {
			table = $(this);
			previous = table.data('tablesort');
			if(previous) {
				previous.destroy();
			}
			table.data('tablesort', new $.tablesort(table, settings));
		});
	};

})(window.Zepto || window.jQuery);
