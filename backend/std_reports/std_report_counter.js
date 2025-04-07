EnableLog("counter_report");
function Log(message)
{
    LogEvent("counter_report", message);
}

/* ---------- Functions ---------- */
function personPassCoursesCounter(personId, startDate, endDate)
{
    passedLearnings = ArraySelectAll(XQuery("for $course in learnings where $course/person_id="+personId+" and $course/state_id = 4 and $course/last_usage_date >= date('"+startDate+"') and $course/last_usage_date <= date('"+endDate+"') return $course"));
    return ArrayCount(passedLearnings);
}


function personPassEventsCounter(personId, startDate, endDate)
{
    allPersonEvents = ArraySelectAll(XQuery("for $er in event_results, $ev in events where $er/person_id ="+personId+" and $er/event_id = $ev/id and $er/event_start_date >= date('"+startDate+"') and $er/event_start_date <= date('"+endDate+"') return $ev"));
    return ArrayCount(allPersonEvents);
}


function personPassTestsCounter(personId, startDate, endDate)
{
    testLearnings = ArraySelectAll(XQuery("for $test in test_learnings where $test/person_id="+personId+" and $test/state_id = 4 and $test/last_usage_date >= date('"+startDate+"') and $test/last_usage_date <= date('"+endDate+"') return $test"));
    return ArrayCount(testLearnings);
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

_allCollaborators = ArraySelectAll(XQuery("for $col in collaborators where $col/is_dismiss = false() and $col/hire_date <= date('"+_endDate+"') return $col"));


for(col in _allCollaborators) {
    passCourses = personPassCoursesCounter(col.id, _startDate, _endDate);
    passEvents = personPassEventsCounter(col.id, _startDate, _endDate);
    passTests = personPassTestsCounter(col.id, _startDate, _endDate);

    if(passCourses > 0) {
        _counter++;
    } 
    else if(passEvents > 0) {
        _counter++;
    }
    else if(passTests > 0) {
        _counter++;
    }

    _counterCourses += passCourses;
    _counterEvents += passEvents;
    _counterTests += passTests;

}

// alert("Всего проходило обучение: " + _counter + " сотрудников.");
// alert("Всего курсов прошли: " + _counterCourses);
// alert("Всего мероприятий прошли: " + _counterEvents);
// alert("Всего тестов прошли: " + _counterTests);


// _RESULT.push({
//     PrimaryKey: 0,
//     counter: String(_counter),
//     counterCourses: String(_counterCourses),
//     counterEvents: String(_counterEvents),
//     counterTests: String(_counterTests)
// });

_RESULT.push({
    PrimaryKey: 0,
    counter: String(11),
    counterCourses: String(22),
    counterEvents: String(33),
    counterTests: String(44)
});
return _RESULT;

}
catch(err)
{
    Log(err);
}