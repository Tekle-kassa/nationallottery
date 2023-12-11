module.exports = (phoneNumber) => {
  // regex for phone number that starts with +251
  const phonePattern = /(^\+\s*2\s*5\s*1\s*(9|7)\s*(([0-9]\s*){8}\s*)$)/;
  // regex for phone number that starts with 09 and 07
  const phonePattern2 = /(^0\s*(9|7)\s*(([0-9]\s*){8})$)/;
  if (!!phoneNumber.match(phonePattern)) return phoneNumber;
  else if (!!phoneNumber.match(phonePattern2))
    return `+251${phoneNumber.slice(1)}`;
  return phoneNumber;
};
