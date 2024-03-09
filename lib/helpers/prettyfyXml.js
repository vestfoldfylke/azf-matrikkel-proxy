const prettifyXML = (xml) => {
  if (!xml) { return '' }

  const options = {
    indent: 2,
    newline: '\n'
  }

  return xml, options
}

module.exports = {
  prettifyXML
}
