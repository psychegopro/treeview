﻿
(function ($) {

    var $listview;
    var settings;

    var methods = {
        init: _initPlugin
        , getData: _exportData
        , hasChanged: _hasChanged
        , revert: _revert
        , commit: _commit
        , select: _select
        , deSelect: _deSelect
        , isSelected: _isSelected
    };

    $.fn.JPTreeView = function (method) {

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on JPTreeView');
        }

    };


    function _initPlugin(options) {

        if (options == null) options = {};
        var $wrap;

        settings = $.extend({
            dataSource: _dummy
            , waitText: 'Retrieving Data'
            , failText: 'An Error Occurred'
            , viewRestricted: false
        }, options);

        return this.each(function () {

            //expected to be UL
            $listview = $(this);
            $listview.data('settings', settings);

            $listview[0].isSelected = _isSelected;
            $listview[0].hasChanged = _hasChanged;
   
            var id = $listview.attr('id');

            $wrap = $listview.wrap('<div class="treeview-wrapper" onselectstart="return false">').parent();
            $wrap.css('width', $listview.css('width')).css('height', $listview.css('height'));

            _goGetMoreNodes($listview, null);

        });







    };

        function _createUL($ul, nodes) {

            var $li;
            $ul.empty();
        $(nodes).each(function () {
            var disabled = !((this.p == undefined) || (this.p));

            $li = $('<li></li>').attr('data-haschildren', this.c ? '1' : '0')
                .attr('data-id', this.id)
                .attr('data-status', (this.s == 1) ? 'checked' : (this.s == 0) ? 'unchecked' : 'mixed')
                .attr('data-ostatus', (this.s == 1) ? 'checked' : (this.s == 0) ? 'unchecked' : 'mixed')
                .attr('data-enabled', ((this.p == undefined) || (this.p)) ? 'true' : 'false')
                .attr('data-cr', ((this.cr == undefined) || (!this.cr)) ? 'false' : 'true')
                .addClass(disabled ? 'tv-disabled' : (this.s == 1) ? 'tv-checked' : (this.s == 0) ? 'tv-unchecked' : 'tv-mixed')
                .attr('data-state', (this.s == 1) ? 'checked' : (this.s == 0) ? 'unchecked' : 'mixed')
                .attr('data-ext', (this.x == undefined) ? '' : this.x)
                .text(this.n);



            //if deep, traverse through children.
            if (this.ch && (this.ch.length > 0)) {
                var $cul = $('<ul class="treeview-node innerNode"></ul>');
                _createUL($cul, this.ch)
                $li.append($cul);
            }

            $ul.append($li);
        });

    }

    function _dummy(parentNode, deep) {
        /*
            expects [ { id : 0, n : '', s : true, ch : null } ]
        */

        var parentId = null;
        if (parentNode) { parentId = parentNode.id; }

        if (parentId == null) {
            return {
                items: [
                    { id: 1, n: 'Client 1', s: 1, p: false, c: false, ch: null }
                    , { id: 2, n: 'Client 2', s: 0, c: false, ch: null }
                    , { id: 3, n: 'this is shorter name', s: 0, c: false, ch: null }
                    , {
                        id: 4, n: 'Client 4', s: 0, cr: true, c: true, ch: [
                        { id: 10, n: 'Client 5', s: 0, c: false, ch: null }
                        , {
                            id: 11, n: 'Client 6', s: 0, cr: true, c: true, ch: [
                            { id: 16, n: 'Client 7', s: 0, c: false, ch: null }
                            , { id: 17, n: 'Client 8', s: 0, cr: true, c: true, ch: null }
                            ]
                        }
                        ]
                    }
                    , { id: 13, n: 'Client 13', s: 0, c: false, ch: null }
                    , { id: 14, n: 'Client 14', s: 0, c: false, p: false, ch: null }
                ]
            };
        } else if (parentId == 11) {
            return {
                items: [
                    { id: 12, n: 'Client 9', s: 0, c: false, ch: null }
                    , { id: 13, n: 'Client 10 is a really long name to test horiz scrolling', s: 0, c: true, p: false, ch: null }
                ]
            };
        } else if (parentId == 13) {
            return {
                items: [
                    { id: 19, n: 'Client 15', s: 0, c: false, p: false, ch: null }
                    , { id: 20, n: 'Client 16', s: 0, c: false, p: false, ch: null }
                ]
            };
        }

    }


    function _init($item, isSubTree) {

        if ($item[0].tagName.toLowerCase() == 'ul') {

            //default to collapsed
            if (isSubTree) { $item.addClass('collapsed').addClass("innerNode"); }
            $item.addClass('treeview-node');


            $item.find('>li').each(function () { _init($(this), true); });

        } else if ($item[0].tagName.toLowerCase() == 'li') {

            var hasChildren = (($item.children().length) || ($item.attr('data-haschildren') == '1'));
            var $children = $item.children().remove();
            var content = $item.text();
            var enabled = $item.attr('data-enabled') == 'true';

            $item.text('');
            $item.attr('data-expanded', (hasChildren) ? 'collapsed' : 'empty').removeClass('tv-expanded tv-collapsed tv-empty')
                .addClass((hasChildren) ? 'tv-collapsed' : 'tv-empty');

            $item.append($('<span class="icon_tv icon_tv_chevron"></span><span class="icon_tv icon_tv_check"></span>'))
                .append($('<span class="content">' + content + '</span>'))
                .append($children);

            $item.find('>ul').each(function () { _init($(this), true); });

            $item.on('click', '>.icon_tv_chevron', function () {

                var $this = $(this);

                var currentStatus = $(this).parent().attr('data-expanded');
                if (!currentStatus) { currentStatus = 'empty'; }

                switch (currentStatus) {
                    case 'empty': break;
                    case 'expanded':
                        var $subNode = $(this).parent().find('.treeview-node');
                        if ($subNode && ($subNode.length > 0)) {
                            $subNode.each(function () {
                                $(this).hide('fast');
                                $(this).parent().attr('data-expanded', 'collapsed').removeClass('tv-expanded tv-collapsed tv-empty').addClass('tv-collapsed');
                            });
                        }
                        $(this).parent().attr('data-expanded', 'collapsed').removeClass('tv-expanded tv-collapsed tv-empty').addClass('tv-collapsed');
                        break;
                    case 'collapsed':
                        var $node = $(this).parent();
                        var $subNode = $node.find('>.treeview-node');
                        if (!$subNode || ($subNode.length == 0)) {
                            if ($node.attr('data-haschildren') == '1') {

                                _goGetMoreNodes($node, _exportNode($node));

                            }



                        } else {
                            $subNode.show('fast');
                        }
                        $(this).parent().attr('data-expanded', 'expanded').removeClass('tv-collapsed tv-empty').addClass('tv-expanded');

                        break;
                    default:
                        alert('uh oh');
                }
            });

            if (!enabled) {

                if (!settings.viewRestricted) {
                    $item.find('> .content').text('Restricted');
                    $item.css('visibility', 'hidden').css('display', 'none');
                } else {

                    $item.removeClass('tv-unchecked tv-mixed tv-checked').addClass('tv-disabled');
                }

            } else {



                $item.on('click', '>.content, >.icon_tv_check', function () {
                    var $node = $(this).parent();
                    var currentStatus = $node.attr('data-status');
                    if (!currentStatus) { currentStatus = 'unchecked'; }
                        

                    switch (currentStatus) {
                        case 'unchecked':
                            /*
                                -select + all descendents
                                -eval ancestors
                            */
                            _selectNode($node, 'checked', 0);
                            break;
                        case 'checked':
                            /*  -unselect + all descendents
                                -eval ancestors
                            */
                            _selectNode($node, 'unchecked', 0);
                            break;
                        case 'mixed':
                            /*
                                -same as 1
                            */

                            _selectNode($node, 'unchecked', 0);
                            break;

                        default: alert('uh oh');
                    }

                        

                });
            }
        }






    };

    function _goGetMoreNodes($node, parent) {
            var $ul;
            var $tmp = $('<li class="temp-node">' + settings.waitText + '</li>');

            if ($node[0].tagName.toLowerCase() == 'ul') {

                $ul = $node;
                $ul.addClass('treeview-node').empty().append($tmp);
             ;

            } else {

                $ul = $('<ul class="treeview-node innerNode"></ul>').append($tmp);
                $node.append($ul);
            }


        //need to get data from caller
        var result = settings.dataSource(parent);

        function _createDynNode(data, parent) {
                _createUL($ul, data.items);


                _init($ul, (parent != null));

    
            //if parent's selection has changed prior to expansion, than we need to update th children
            if (($node.attr('data-status') == 'checked') || ($node.attr('data-status') == 'unchecked')) {
                var newState = $node.attr('data-status');
                        $ul.find('>li').each(function () {
                    if ($(this).attr('data-enabled') == 'true') {
                        $(this).attr('data-status', newState).removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-' + newState);
                    }
                });
            }
                    $ul.removeClass('collapsed');

        }

        if ((result.fail) && (typeof (result.fail) == 'function')) {

            result.fail(function () { $ul.find(' > li').text(settings.failText); });

        }

        //is a promise
        if ((result.done) && (typeof (result.done) == 'function')) {


            result.done(function (data, status, jqXHR) {

                _createDynNode(data, parent);

            });
            //var f = result.done;
            //result.done = function (data, status, jqXHR) {

            //    _createDynNode(data, parent);

            //    f(data, status, jqXHR);
            //};

        } else {
            _createDynNode(result);
        }



    }


    function _selectNode(node, status, direction, deep) {

        var myStatus = status;
        var myStatusDisplay = status;

        if (deep == null) { deep = true; }

        if (status == 'checked') {
            var hasRestrictedChildren = ((node.attr('data-cr') == 'true') || (node.find('li[data-enabled="false"]').length))
            myStatusDisplay = (hasRestrictedChildren) ? (settings.viewRestricted) ? 'mixed' : 'checked' : 'checked'
            //myStatusDisplay = myStatus;


        }
        if (node.attr('data-enabled') == 'false') {
            myStatusDisplay = 'disabled';
        }

        switch (direction) {
            case 0: //both


                node.attr('data-status', myStatus).removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-' + myStatusDisplay);
                    
                //only triggering on self.  Havn't decided if i need to trigger on all ancestors/descendents whose state changes as a result.
                $listview.trigger('onchange', [_exportNode(node), _hasChanged()]);

                if (deep) {
                    node.find('> ul > li').each(function () { _selectNode($(this), status, -1); });

                    if (node.parent().parent()[0].tagName.toLowerCase() == 'li') { _selectNode(node.parent().parent(), status, 1); }
                }
                break;
            case 1: //upwards
                //if all children are selected, set to 1, if none, -1, if some 0
                //var childCount = node.find('> ul > li').length;
                //var selectedCount = node.find('> ul > li[data-status="checked"]').length;
                //var mixedCount = node.find('> ul > li[data-status="mixed"]').length;
                //var enabledCount = (childCount - node.find('> ul > li[data-cr="true"]').length) - node.find('> ul > li[data-enabled="false"]').length;

                var childCount = node.find('li').length;
                var selectedCount = node.find('li[data-status="checked"]').length;
                var mixedCount = node.find('li[data-status="mixed"]').length;
                var disabledCount = node.find('li[data-enabled="false"]').length;


                if ((selectedCount == 0) && (mixedCount == 0)) {
                    node.attr('data-status', 'unchecked').removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-unchecked');


                } else if (selectedCount == childCount) {
                    node.attr('data-status', 'checked').removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-checked');

                } else if ((!settings.viewRestricted) && (disabledCount > 0) && (childCount == (disabledCount + mixedCount + selectedCount))) {


                    node.attr('data-status', 'mixed').removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-checked');
                } else if (mixedCount > 0) {
                    node.attr('data-status', 'mixed').removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-mixed');

                } else {
                    node.attr('data-status', 'mixed').removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-mixed');

                }
                    
                if (node.parent().parent()[0].tagName.toLowerCase() == 'li') { _selectNode(node.parent().parent(), status, 1); }

                break;
            case -1:
                if (node.attr('data-enabled') == 'true') {


                    var childCount = node.find('> ul > li').length;
                    node.attr('data-status', myStatus).removeClass('tv-checked tv-unchecked tv-mixed').addClass('tv-' + myStatusDisplay);
                    node.find('> ul > li').each(function () { _selectNode($(this), status, -1); });
                }
                break;
            default:
                alert('uh oh');
        }

    }


    function _exportNode($node) {
        return {
            id: $node.attr('data-id')
                    , d: ($node.attr('data-status') == 'checked') ? 1 : -1
                    , x: $node.attr('data-ext')
        };
        
    }


    function _exportData($node, deep) {



        var nodes = new Array();
        var $this = $(this);
        if ($node) {
            $this = $node;
        }


        if ($this[0].tagName.toLowerCase() == 'li') {

            if ($this.attr('data-status') != 'unchecked') {
              
            return {
                    id: $this.attr('data-id')
                    , d: ($this.attr('data-status') == 'checked') ? 1 : -1
                    , x: $this.attr('data-ext')
                    , c: (deep && ($this.find('> ul').length > 0)) ? _exportData($this.find('> ul'), deep) : null
            };
            }
        } else {

            //no need to traverse unchecked items.
            $this.find('> li').filter(function(index) { return $(this).attr('data-status') != 'unchecked'; }).each(function () {
                nodes.push(_exportData($(this), deep));
            });
        }


        return nodes;

    };

    function _hasChanged() {

            if (!$listview) { $listview = $(this); }
            settings = $listview.data('settings');
            return $listview.find('li').filter(function (index) { return $(this).attr('data-status') != $(this).attr('data-ostatus'); }).length > 0;
     
    }

    function _revert() {
        return this.each(function () {
            if (!$listview) { $listview = $(this); }
            settings = $listview.data('settings');

            if (_hasChanged()) {

                $listview.empty();
                _goGetMoreNodes($listview, null);
            }
            //settings = $listview.data('settings');



            //$listview.find('li').filter(function (index) { return $(this).attr('data-status') != $(this).attr('data-ostatus'); }).each(function () {
            //    var $this = $(this);
            //    // $this.attr('data-status', $this.attr('data-ostatus'));
            //    _selectNode($this, $this.attr('data-ostatus'), 0, false);
            //});
        });
    }

    function _commit() {
        return this.each(function () {
            if (!$listview) { $listview = $(this); }
            settings = $listview.data('settings');
            $listview.find('li').filter(function (index) { return $(this).attr('data-status') != $(this).attr('data-ostatus'); }).each(function () {
                var $this = $(this);
                $this.attr('data-ostatus', $this.attr('data-status'));
            });
        });
    }

    function _select(id, ext)
    {
        return this.each(function () {
            if (!$listview) { $listview = $(this); }
            settings = $listview.data('settings');
            _setStatus(id, ext, 'checked');
        });
    }

    function _deSelect(id, ext) {
        return this.each(function () {
            if (!$listview) { $listview = $(this); }
            settings = $listview.data('settings');
            _setStatus(id, ext, 'unchecked');
        });
    }

    function _match(id, ext) {
        var m1 = $listview.find('li[data-id="' + id + '"]');


        if ((m1) && (m1.length > 0)) {
            //if extended data supplied, filter for that
            if (!ext) ext = '';

            return m1.filter(function (index) {
                var $this = $(this);
                var nodeExt = $this.attr('data-ext');
                nodeExt = (nodeExt === undefined) ? '' : nodeExt;

                return (((ext.length == 0) && (nodeExt == '')) || ((ext.length > 0) && (nodeExt == ext)));
            });
        }

        return undefined;
    }

    function _isSelected(id, ext) {


        if (!$listview) { $listview = $(this); }
        settings = $listview.data('settings');
            var m1 = _match(id, ext);
            if (m1 && (m1.length > 0)) {
                var s = $(m1[0]).attr('data-status');
                return s == 'checked';
            }
   
    }

    function _setStatus(id, ext, status)
    {

            
        var m1 = _match(id, ext);
        if (m1) { 

            m1.each(function () {
                if ($(this).attr('data-status') != status) {
                    _selectNode($(this), status, 0, true);
                }
            });
        }
  
    }

})(jQuery);
