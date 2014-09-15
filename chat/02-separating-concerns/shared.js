function InboundMsg(content, author) {
  this.content = content;
  this.author = author;
}

function OutboundMsg(content, recipients) {
  this.content = content;
  this.recipients = recipients;
}

module.exports = {
  InboundMsg: InboundMsg,
  OutboundMsg: OutboundMsg
};
