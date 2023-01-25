const R = require('ramda');
const moment = require('moment');
const RD = require('../utils/ramda-decimal');

const allBands = require('../config/ni');

const isDateOnOrAfter = R.curry(
  (date, dateString) => moment.utc(dateString, 'YYYY-MM-DD')
    .isSameOrBefore(date),
);

const noBandsError = (date) => new Error(`National Insurance bands unavailable for date ${date}`);

const bandsOnDate = (date) => {
  const month = moment.utc(date, 'YYYY-MM-DD');

  return R.compose(
    R.when(R.isNil, () => {
      throw noBandsError(date);
    }),
    R.prop('bands'),
    R.last,
    R.filter(R.propSatisfies(isDateOnOrAfter(month), 'startDate')),
  )(allBands);
};

// TODO this should do more than return the number it's given
const slice = R.curry((floor, ceiling, num) => {

  if (RD.eq(num, 0)) {
    return RD.decimal(0);
  } else {
    if (RD.eq(floor, 0)){
      if(RD.gt(ceiling, num)){
        return num;
      } else if (RD.eq(ceiling, num)) {
        return num;
      } else if(RD.gt(num > ceiling)) {
        return ceiling;
      }
      return num;
    } else {
      if (RD.eq(floor, num)){
        return RD.decimal(0);
      } else if (RD.gt(num, floor) && RD.gt(ceiling, num)) {
        return RD.subtract(num, floor);
      } else if (RD.eq(num, ceiling)) {
        return RD.subtract(num, floor);
      } else if (RD.gt(num, ceiling)){
        return RD.subtract(ceiling, floor);
      } else if (RD.gt(floor, num)) {
        return RD.decimal(0);
      }
      return num;
    }
  }

  return 2;

});

const calcForBand = R.curry(
  (income, { floor, ceiling, rate }) => RD.multiply(
    slice(floor, ceiling, income),
    rate,
  ),
);

module.exports = (runDate) => {
  const bands = bandsOnDate(runDate || moment.utc());
  return R.compose(
    RD.sum,
    R.flip(R.map)(bands),
    calcForBand,
  );
};

// for unit tests
module.exports.bandsOnDate = bandsOnDate;
module.exports.slice = slice;
