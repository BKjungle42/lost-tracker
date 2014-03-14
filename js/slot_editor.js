goog.provide('lost_tracker.SlotEditor');

goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.string');
goog.require('goog.ui.AdvancedTooltip');
goog.require('goog.ui.PopupBase.EventType');

/**
 * @param slotsTableId {object} TODO: doc
 * @param noSlotsTableId {object} TODO: doc
 * @constructor
 */
lost_tracker.SlotEditor = function(slotsTableId, noSlotsTableId) {
  this.slotsTable = goog.dom.getElement(slotsTableId);
  this.noSlotsTable = goog.dom.getElement(noSlotsTableId);
  this.init();
};


/**
 * The class logger
 */
lost_tracker.SlotEditor.LOG = goog.debug.Logger.getLogger(
  'lost_tracker.SlotEditor');

/**
 * 
 * @param groupName {object} TODO: doc
 * @param time {object} TODO: doc
 * @param oldValue {object} TODO: doc
 */
lost_tracker.SlotEditor.prototype.startsAt = function(groupName, time, oldValue) {
  var empty = goog.string.isEmptySafe;
  var self = this;
  if (empty(groupName) && !empty(oldValue)) {
    url = '/timeslot/none/' + oldValue;
    goog.net.XhrIo.send(url, function(evt) {
      var xhr = evt.target;
      if (xhr.isSuccess()) {
        self.addReserve(oldValue);
      } else {
        // TODO: show error
        lost_tracker.SlotEditor.LOG.severe('XHR failed!');
      }
    });
  } else if (!empty(groupName)) {
    url = '/timeslot/' + time + '/' + groupName;
    goog.net.XhrIo.send(url, function(evt) {
      var xhr = evt.target;
      if (xhr.isSuccess()) {
        self.removeReserve(groupName);
      } else {
        // TODO: show error
        lost_tracker.SlotEditor.LOG.severe('XHR failed!');
      }
    });
  } else {
    lost_tracker.SlotEditor.LOG.fine('Unexpected input! new_value: ' +
        groupName + ' oldValue: ' + oldValue);
  }
};


/**
 * 
 * @param groupName {object} TODO: doc
 */
lost_tracker.SlotEditor.prototype.addReserve = function(groupName) {
  lost_tracker.SlotEditor.LOG.fine('Putting ' + groupName + ' on reserve');
  var self = this;
  var header = goog.dom.getFirstElementChild(this.noSlotsTable);
  var body = goog.dom.getNextElementSibling(header);
  var rows = goog.dom.getElementsByTagNameAndClass('tr', null, body);
  var newCell = goog.dom.createDom('td', null, groupName);
  this.attachToolTip(newCell);
  var newRow = goog.dom.createDom('tr', null, newCell)
  var inserted = goog.array.some(rows, function(row) {
    var cols = goog.dom.getElementsByTagNameAndClass('td', null, row);
    var cellName = goog.dom.getTextContent(cols[0]);
    if (cellName == groupName) {
      lost_tracker.SlotEditor.LOG.severe(groupName +
        ' already exists in reserve table!');
    } else if (groupName < cellName) {
      lost_tracker.SlotEditor.LOG.info('Inserting ' +
        groupName + ' before ' + row);
      body.insertBefore(newRow, row);
      return true;
    }
  });
  if (!inserted) {
    lost_tracker.SlotEditor.LOG.info('Not inserted. Appending now!');
    body.appendChild(newRow);
  }
};


/**
 * 
 * @param groupName {object} TODO: doc
 */
lost_tracker.SlotEditor.prototype.removeReserve = function(groupName) {
  lost_tracker.SlotEditor.LOG.fine('Removing "' + groupName + '" from reserve');
  var self = this;
  var header = goog.dom.getFirstElementChild(this.noSlotsTable);
  var body = goog.dom.getNextElementSibling(header);
  var rows = goog.dom.getElementsByTagNameAndClass('tr', null, body);
  goog.array.some(rows, function(row) {
    var cols = goog.dom.getElementsByTagNameAndClass('td', null, row);
    var cellName = goog.dom.getTextContent(cols[0]);
    if (cellName == groupName) {
      goog.dom.removeNode(row);
      return true;
    }
  });
};


/**
 * 
 * @param node {object} TODO: doc
 */
lost_tracker.SlotEditor.prototype.attachToolTip = function(node) {
  var tooltip = new goog.ui.AdvancedTooltip(node);
  var nodeText = goog.dom.getTextContent;
  var trim = goog.string.trim;
  goog.events.listen(tooltip, goog.ui.PopupBase.EventType.BEFORE_SHOW, function(evt) {
    // TODO
    var groupName = trim(nodeText(node));
    if (goog.string.isEmptySafe(groupName)) {
      return false;
    }
    tooltip.setHtml(
      '<h1>' + groupName + '</h1>' +
      'Contact: <br />' +
      'Send e-mail: <a href="mailto:#"><img valign="middle" src="/static/icons/email.png" /></a><br />' +
      '', true);
  });
  tooltip.className = 'tooltip';
  tooltip.setHotSpotPadding(new goog.math.Box(5, 5, 5, 5));
  tooltip.setCursorTracking(true);
  tooltip.setMargin(new goog.math.Box(0, 0, 0, 0));
  tooltip.setHideDelayMs(250);
};


/**
 * 
 * @param  {object} TODO: doc
 */
lost_tracker.SlotEditor.prototype.init = function() {
  var nodeText = goog.dom.getTextContent;
  var trim = goog.string.trim;
  var self = this;
  var header = goog.dom.getFirstElementChild(this.slotsTable);
  var body = goog.dom.getNextElementSibling(header);
  var rows = goog.dom.getElementsByTagNameAndClass('tr', null, body);
  goog.array.forEach(rows, function(element) {
    var cols = goog.dom.getElementsByTagNameAndClass('td', null, element);
    var timeSlot = cols[0];
    var dirA = cols[1];
    var dirB = cols[2];
    var oldValueA = trim(nodeText(dirA));
    var oldValueB = trim(nodeText(dirB));
    self.attachToolTip(dirA);
    self.attachToolTip(dirB);
    goog.events.listen(dirA, goog.events.EventType.BLUR, function(evt) {
      self.startsAt(trim(nodeText(evt.target)), trim(nodeText(timeSlot)), oldValueA);
      oldValueA = trim(nodeText(evt.target));
    });
    goog.events.listen(dirB, goog.events.EventType.BLUR, function(evt) {
      self.startsAt(trim(nodeText(evt.target)), trim(nodeText(timeSlot)), oldValueB);
      oldValueB = trim(nodeText(evt.target));
    });
  });

  var nsHeader = goog.dom.getFirstElementChild(this.noSlotsTable);
  var nsBody = goog.dom.getNextElementSibling(nsHeader);
  var nsRows = goog.dom.getElementsByTagNameAndClass('tr', null, nsBody);
  goog.array.forEach(nsRows, function(element) {
    var cols = goog.dom.getElementsByTagNameAndClass('td', null, element);
    self.attachToolTip(cols[0]);
  });
};


// vim: set ft=closure.javascript :