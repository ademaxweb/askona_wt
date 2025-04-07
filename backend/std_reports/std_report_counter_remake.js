EnableLog("counter_report");
function Log(message)
{
    LogEvent("counter_report", message);
}

/* ---------- Main program ---------- */
try
{


_RESULT = [];

_counter = 0;
_counterCourses = 0;
_counterEvents = 0;
_counterTests = 0;
_startDate = _CRITERIONS[0].value;
_endDate = _CRITERIONS[1].value;

// _startDate = Param.startDate;
// _endDate = Param.endDate;

_sql =
    "with \
        person_learnins as ( \
            select \
                person_id, \
                count(*) as count \
            from dbo.learnings \
            where \
                last_usage_date between convert(datetime, '" + _startDate + "', 104) and convert(datetime, '" + _endDate + "', 104) \
                and state_id = 4 \
            group by person_id \
        ), \
        person_tests as ( \
            select \
                person_id, \
                count(*) as count \
            from dbo.test_learnings \
            where \
                last_usage_date between convert(datetime, '" + _startDate + "', 104) and convert(datetime, '" + _endDate + "', 104) \
                and state_id = 4 \
            group by person_id \
        ), \
        person_events as ( \
            select \
                person_id, \
                count(*) as count \
            from dbo.event_results \
            where \
                event_start_date between convert(datetime, '" + _startDate + "', 104) and convert(datetime, '" + _endDate + "', 104) \
            group by person_id \
        ), \
        counters as ( \
            select \
                cs.id, \
                coalesce(pls.count, 0) as learnings, \
                coalesce(pts.count, 0) as tests, \
                coalesce(pes.count, 0) as events \
            from dbo.collaborators cs \
            left join person_learnins pls on cs.id = pls.person_id \
            left join person_tests pts on cs.id = pts.person_id \
            left join person_events pes on cs.id = pes.person_id \
            where \
                is_dismiss = 0 \
                and hire_date <= convert(datetime, '" + _endDate + "', 104)\
        ) \
    select \
        count(case when learnings > 0 or tests > 0 or events > 0 then 1 end) as count, \
        sum(learnings) as learnings, \
        sum(tests) as tests, \
        sum(events) as events \
    from counters";

_res = ArrayOptFirstElem(XQuery("sql: " + _sql), null);

if (_res == null)
{
    return [
        {
            PrimaryKey: 0,
            counter: 0,
            counterCourses: 0,
            counterEvents: 0,
            counterTests: 0
        }
    ]
}

_RESULT.push({
    PrimaryKey: 0,
    counter: _res.count.Value,
    counterCourses: _res.learnings.Value,
    counterEvents: _res.events.Value,
    counterTests: _res.tests.Value
});
return _RESULT;

}
catch(err)
{
    Log(err);
}