import React, { CSSProperties, memo, useMemo } from "react";
import { addDays, startOfDay, startOfWeek } from "date-fns";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

const MSECS_PER_MINUTE = 60 * 1000;
const MSECS_PER_HOUR = MSECS_PER_MINUTE * 60;
const MSECS_PER_DAY = MSECS_PER_HOUR * 24;
const MSECS_PER_WEEK = MSECS_PER_DAY * 7;

// TODO: localize this to support non-Sunday start of week
const FIRST_SUNDAY_LOCAL = Object.freeze(new Date(1970, 0, 4)) as Date;
const FIRST_SUNDAY_UTC = Object.freeze(new Date(Date.UTC(1970, 0, 4))) as Date;
const FIRST_SUNDAY_UTC_MSECS = FIRST_SUNDAY_UTC.getTime();

/**
 * Converts a local date/time to a date-only UTC value.
 * First the time is removed from the local Date, then that
 * date-only local Date (whose toString() will return 0:00)
 * is converted to the equivalent UTC date (whose toUTCString()
 * will return 0:00).
 * @param {string} datetime - Local date/time to be converted
 */
function toUTCDateOnly(datetime: Date) {
  return new Date(
    Date.UTC(datetime.getFullYear(), datetime.getMonth(), datetime.getDate())
  );
}

/**
 * Returns the index of the week containing the supplied date,
 * with 0 being the week starting on Sunday, January 4, 1970.
 * @param {string} date - Local date/time to be converted into a week index
 */
function getWeekIndex(date: Date) {
  const utcDateOnly = toUTCDateOnly(date).getTime();
  const diffMsecs = utcDateOnly - FIRST_SUNDAY_UTC_MSECS;
  const weeks = diffMsecs / MSECS_PER_WEEK;
  return Math.floor(weeks);
}

interface TopCalendarProps {
  selectedDate: Date;
  startDate?: Date;
  dayCount?: number;
}

interface RenderOneWeekProps {
  index: number;
  style: CSSProperties;
  selectedDate: Date;
}

function RenderOneWeek(props: RenderOneWeekProps) {
  console.log(
    `Rendering week ${
      props.index
    } with selected date ${props.selectedDate.toString()}`
  );
  const today = startOfDay(new Date());
  const firstDate = addDays(FIRST_SUNDAY_LOCAL, props.index * 7);
  return (
    <ul
      key={firstDate.getTime()}
      style={{ ...props.style, height: 54, scrollSnapAlign: "start" }}
      className="top-calendar-row"
    >
      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
        const date = addDays(firstDate, dayIndex);
        const dateNumber = date.getDate();
        const classes = ["big-date-day"];
        if (date.getTime() === props.selectedDate.getTime()) {
          classes.push("big-date-selected");
        }
        if (dateNumber === 1) {
          classes.push("first-day-of-month");
        }
        if (date.getTime() === today.getTime()) {
          classes.push("big-date-today");
        } else if (date.getTime() < today.getTime()) {
          classes.push("big-date-past");
        } else {
          // if (date.getTime() < today.getTime()) {
          classes.push("big-date-future");
        }
        return (
          <li
            key={dayIndex}
            style={{ flex: 1 }}
            className={classes.join(" ")}
            title={date.toDateString()}
          >
            <div className="big-date">
              {dateNumber === 1 ? (
                // first day of the month gets the month shown above (smaller) "1"
                <div className="big-date-month-name">
                  {date.toLocaleDateString("default", { month: "short" })}
                </div>
              ) : null}
              <div className="big-date-text">{dateNumber}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// adapted from react-window's shallowDiffers/AreEqual functions, but extended to support
// value equality for Date instances.
function shallowDiffers(prev: any, next: any): boolean {
  for (let attribute in prev) {
    if (!(attribute in next)) {
      console.log(`${attribute} different: missing in next props`);
      return true;
    }
  }
  for (let attribute in next) {
    const prevAttribute = prev[attribute];
    const nextAttribute = next[attribute];
    const datesEqual =
      prevAttribute instanceof Date &&
      nextAttribute instanceof Date &&
      prevAttribute.getTime() === nextAttribute.getTime();

    if (!datesEqual && prevAttribute !== nextAttribute) {
      console.log(
        `${attribute} different: was ${prevAttribute.toString()} but will be ${nextAttribute.toString()}`
      );
      return true;
    }
  }
  return false;
}
function areEqual<T extends { style: React.CSSProperties }>(
  prevProps: T,
  nextProps: T
): boolean {
  const { style: prevStyle, ...prevRest } = prevProps;
  const { style: nextStyle, ...nextRest } = nextProps;

  const propsEqual =
    !shallowDiffers(prevStyle, nextStyle) &&
    !shallowDiffers(prevRest, nextRest);
  if (!propsEqual) {
    console.log(
      `Props not equal. Old: ${JSON.stringify(prevProps)} New: ${JSON.stringify(
        nextProps
      )}`
    );
  }
  return propsEqual;
}

/**
 * Custom hook to ensure that dates with the same value are treated as the same
 * date by React.  Helps prevent re-renders caused by props with the same
 * date/time value.
 * @param date {Date} - Date to use
 */
function useDate(date: Date) {
  const msecs = date.getTime();
  // The ESLint rule complains that `date` isn't in the deps list, but the whole
  // point of this hook is to consider two Date instances equivalent if they
  // refer to the same date/time value. So useMemo will depend on `msecs` and
  // not the Date object.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => date, [msecs]);
}

const TopCalendar = (props: TopCalendarProps) => {
  if (
    props.startDate &&
    props.startDate.getTime() !== startOfWeek(props.startDate).getTime()
  ) {
    throw new Error(
      `Start date ${props.startDate.toString()} must be midnight at the start of a Sunday`
    );
  }
  const selectedDate = useDate(props.selectedDate);
  const startDate = useDate(
    startOfDay(props.startDate || startOfWeek(selectedDate))
  );
  const Row = memo(
    ({ index, style }: ListChildComponentProps) => (
      <RenderOneWeek
        key={index}
        index={index}
        style={style}
        selectedDate={selectedDate}
      />
    ),
    areEqual
  );

  return (
    <div className="top-calendar">
      <List
        height={108}
        width="100%"
        itemSize={54}
        initialScrollOffset={54 * getWeekIndex(startDate)}
        itemCount={1000000}
        className="big-date-container"
      >
        {Row}
      </List>
    </div>
  );
};

export default TopCalendar;
