/* --------------- Log --------------- */
_log_tag = "email_report_hyper_rainbow"
EnableLog(_log_tag);

function log(message) {
    LogEvent(_log_tag, message);
}

/* --------------- Functions --------------- */

function setTableTitle(coursesTopElems, eventsTopElems, testsTopElems) {

    _resultTitle = "<th>ФИО сотрудника</th>"+
        "<th>Стаж (дней)</th>"+
        "<th>Почта</th>"+
        "<th>Должность</th>"+
    "<th>Подразделение</th>";

    for(teCourse in coursesTopElems) {

        _resultTitle += "<th>"+ teCourse.name +"</th>";
    }

    for(teEvent in eventsTopElems) {

        _resultTitle += "<th>"+ teEvent.name +"</th>";
    }

    for(teTest in testsTopElems) {

        _resultTitle += "<th>"+ teTest.name +"</th>";
    }

    return _resultTitle;
}


function getCourseTestStatusInfo(courseCards) {

    courseInfoResult = { 
        statusText: "<span>Не назначен</span>",
        stateId: -1
    }

    courseInfo = ArrayOptFind(courseCards, "This.state_id==4");

    if( courseInfo != undefined) {
        courseInfoResult.statusText =  "<span style='color:green'>Пройден</span>";
        courseInfoResult.stateId = 4;
    } else {

        courseInfo = ArrayOptFind(courseCards, "This.state_id==2");
        if( courseInfo != undefined) {

            courseInfoResult.statusText =  "<span style='color:green'>Завершен</span>";
            courseInfoResult.stateId = 2;
        } else {

            courseInfo = ArrayOptFind(courseCards, "This.state_id==1");
            if( courseInfo != undefined) {

                courseInfoResult.statusText =  "<span>В процессе</span>";
                courseInfoResult.stateId = 1;
            } else {

                courseInfo = ArrayOptFind(courseCards, "This.state_id==0");
                if( courseInfo != undefined) {

                    courseInfoResult.statusText =  "<span>Назначен</span>";
                    courseInfoResult.stateId = 0;
                } else {

                    courseInfo = ArrayOptFind(courseCards, "This.state_id==3");
                    if( courseInfo != undefined) {
                        
                        courseInfoResult.statusText = "<span style='color:red'>Не пройден</span>";
                        courseInfoResult.stateId = 3;
                    }
                }
            }
        }
    }

    return courseInfoResult;
}


function setTrainingResultInfo(coursesIds, eventsIds, testsIds) {

    trainingResultInfo = {};

    for(courseId in coursesIds) {
        trainingResultInfo.SetProperty(courseId, 0);
    }

    for(eventId in eventsIds) {
        trainingResultInfo.SetProperty(eventId, 0);
    }

    for(testId in testsIds) {
        trainingResultInfo.SetProperty(testId, 0);
    }

    return trainingResultInfo;
}


function setArrayTeElems(elemIds) {
    resultArray = [];

    for(elemId in elemIds) {
        resultArray.push( tools.open_doc(elemId).TopElem );
    }

    return resultArray;
}


function getCourses(coursesIds, groupsIds, startDate, endDate) {

    sqlQueryActiveLearnings = "sql: SELECT active_learnings.course_id, active_learnings.course_name, active_learnings.person_id, active_learnings.state_id "+
    "FROM active_learnings JOIN group_collaborators ON active_learnings.person_id = group_collaborators.collaborator_id " +
    "WHERE active_learnings.course_id IN ("+ArrayMerge(coursesIds, "This", ",")+") and group_collaborators.group_id IN ("+ArrayMerge(groupsIds, "This", ",")+") ";

    sqlQueryPassedLearnings = "sql: SELECT learnings.course_id, learnings.course_name, learnings.person_id, learnings.state_id "+
    "FROM learnings JOIN group_collaborators ON learnings.person_id = group_collaborators.collaborator_id " +
    "WHERE learnings.course_id IN ("+ArrayMerge(coursesIds, "This", ",")+") and group_collaborators.group_id IN ("+ArrayMerge(groupsIds, "This", ",")+") ";

    if(startDate != "") {
        sqlQueryActiveLearnings += "and active_learnings.creation_date >= "+SqlLiteral(startDate)+" ";
        sqlQueryPassedLearnings += "and learnings.creation_date >= "+SqlLiteral(startDate)+" ";
    }

    if(endDate != "") {
        sqlQueryActiveLearnings += "and active_learnings.creation_date <= "+SqlLiteral(endDate) + " ";
        sqlQueryPassedLearnings += "and learnings.creation_date <= "+SqlLiteral(endDate) + " ";
    }

    activeLearnings = ArraySelectAll( XQuery(sqlQueryActiveLearnings) );
    passedLearnings = ArraySelectAll( XQuery(sqlQueryPassedLearnings) );

    allCourses = ArrayUnion(activeLearnings, passedLearnings);
    return allCourses;
}


function getEvents(eventsIds, groupsIds, startDate, endDate) {

    sqlQueryEvents = "sql: SELECT event_collaborators.event_type_id, event_collaborators.name, event_collaborators.collaborator_id "+
    "FROM event_collaborators JOIN group_collaborators ON event_collaborators.collaborator_id = group_collaborators.collaborator_id " +
    "WHERE event_collaborators.event_type_id IN ("+ArrayMerge(eventsIds, "This", ",")+") and group_collaborators.group_id IN ("+ArrayMerge(groupsIds, "This", ",")+") ";

    if(startDate != "") {
        sqlQueryEvents += "and event_collaborators.start_date >= "+SqlLiteral(startDate)+" ";
    }

    if(endDate != "") {
        sqlQueryEvents += "and event_collaborators.start_date <= "+SqlLiteral(endDate) + " ";
    }

    allEvents = ArraySelectAll( XQuery(sqlQueryEvents) );

    return allEvents;
}


function getTests(testsIds, groupsIds, startDate, endDate) {

    sqlQueryActiveTests = "sql: SELECT active_test_learnings.assessment_id, active_test_learnings.assessment_name, active_test_learnings.person_id, active_test_learnings.state_id "+
    "FROM active_test_learnings JOIN group_collaborators ON active_test_learnings.person_id = group_collaborators.collaborator_id " +
    "WHERE active_test_learnings.assessment_id IN ("+ArrayMerge(testsIds, "This", ",")+") and group_collaborators.group_id IN ("+ArrayMerge(groupsIds, "This", ",")+") ";

    sqlQueryPassedTests = "sql: SELECT test_learnings.assessment_id, test_learnings.assessment_name, test_learnings.person_id, test_learnings.state_id "+
    "FROM test_learnings JOIN group_collaborators ON test_learnings.person_id = group_collaborators.collaborator_id " +
    "WHERE test_learnings.assessment_id IN ("+ArrayMerge(testsIds, "This", ",")+") and group_collaborators.group_id IN ("+ArrayMerge(groupsIds, "This", ",")+") ";

    if(startDate != "") {
        sqlQueryActiveTests += "and active_test_learnings.creation_date >= "+SqlLiteral(startDate)+" ";
        sqlQueryPassedTests += "and test_learnings.creation_date >= "+SqlLiteral(startDate)+" ";
    }

    if(endDate != "") {
        sqlQueryActiveTests += "and active_test_learnings.creation_date <= "+SqlLiteral(endDate) + " ";
        sqlQueryPassedTests += "and test_learnings.creation_date <= "+SqlLiteral(endDate) + " ";
    }

    activeTests = ArraySelectAll( XQuery(sqlQueryActiveTests) );
    passedTests = ArraySelectAll( XQuery(sqlQueryPassedTests) );

    allTests = ArrayUnion(activeTests, passedTests);
    return allTests;
}


function sendReport(files, personId, title, textBody) {

    var newNotify = OpenNewDoc ('x-local://wtv/wtv_dlg_notification_template.xml').TopElem;

    newNotify.recipients.AddChild().recipient_type = 'in_doc'; // отправление сообщения сотруднику
    newNotify.subject = title;
    newNotify.body_type = 'html';
    newNotify.body = textBody;

    for(fileElem in files) {

        sExt = ".xls";
        sTempFilename = ObtainTempFile(sExt);
        PutUrlText(sTempFilename, fileElem.data);

        fldAttach = newNotify.attachments.AddChild();
        fldAttach.name = fileElem.name + sExt;
    
        try
        {
            fldAttach.data.LoadFromFile(sTempFilename);
            
            try
            {
                DeleteUrl(sTempFilename);
            }
            catch(e) {}
        }
        catch(e)
        {
            log("Ошибка: не могу прикрепить сформированный отчет: " + e);
        }
    }

    successSent = tools.create_notification( '0', Int(personId), '', null, null, null, newNotify);
    return successSent;
}


function extractXmlDate(date) {
    try {
        xmlDate =  StrXmlDate( ParseDate( Date(date)) );
    } catch(e) {
        return "";
    }
}


/* --------------- Main Program --------------- */

_coursesIds = tools_web.parse_multiple_parameter(Param.courses);
_eventsIds = tools_web.parse_multiple_parameter(Param.events);
_testsIds = tools_web.parse_multiple_parameter(Param.tests);

_groupsIds = tools_web.parse_multiple_parameter(Param.groups);
_emailRecipientsIds = tools_web.parse_multiple_parameter(Param.email_recipients);

_emailTitle = Param.email_title;

_sendToFuncManagers = undefined;
_funcManagersTypeIds = undefined;
_calculateTotalPercentage = undefined;
_positions = undefined;
_ignoreNotAssigned = undefined;
_totalPercentage = 0.0;
_countTotalLearnings = 0;
_totalPercentagesByLearning = [];

// HasProperty на случай, если в старом отчете нет этих переменных
if( Param.HasProperty("send_to_functional_managers") ) {
    _sendToFuncManagers = Param.send_to_functional_managers;

    if(_sendToFuncManagers) {
        _funcManagersTypeIds = tools_web.parse_multiple_parameter(Param.boss_type_ids);
    }
}

if( Param.HasProperty("calculate_total_completion_percentage") ) {
    _calculateTotalPercentage = Param.calculate_total_completion_percentage;
}

if( Param.HasProperty("positions") ) {
    _positions = tools_web.parse_multiple_parameter(Param.positions);
}

if( Param.HasProperty("ignore_not_assigned") ) {
    _ignoreNotAssigned = Param.ignore_not_assigned;
}

_allCourses = [];
_allEvents = [];
_allTests = [];

// Подготовка данных
if( ArrayCount(_coursesIds) != 0) {

    _startDate = "";
    _endDate = "";

    if(Param.course_start_date != "") {
        _startDate = Date( StrDate( Date(Param.course_start_date), false) );
    }

    if(Param.course_end_date != "") {
        _endDate = Date( StrDate( Date(Param.course_end_date), false) );
    }
  
    _allCourses = getCourses(_coursesIds, _groupsIds, _startDate, _endDate);
}

if( ArrayCount(_eventsIds) != 0) {
    
    // _startDate = extractXmlDate(Param.event_start_date);
    // _endDate = extractXmlDate(Param.event_end_date);

    _startDate = "";
    _endDate = "";

    if(Param.event_start_date != "") {
        _startDate = DateNewTime( Date(Param.event_start_date), 0, 0, 0 );
    }

    if(Param.event_end_date != "") {
        _endDate = DateNewTime( Date(Param.event_end_date), 23, 59, 59 );
    }

    _allEvents = getEvents(_eventsIds, _groupsIds, _startDate, _endDate);
}

if( ArrayCount(_testsIds) != 0) {

    _startDate = "";
    _endDate = "";

    // _startDate = extractXmlDate(Param.test_start_date);
    // _endDate = extractXmlDate(Param.test_end_date);

    if(Param.test_start_date != "") {
        _startDate = DateNewTime( Date(Param.test_start_date), 0, 0, 0 );
    }

    if(Param.test_end_date != "") {
        _endDate = DateNewTime( Date(Param.test_end_date), 23, 59, 59 );
    }

    _allTests = getTests(_testsIds, _groupsIds, _startDate, _endDate);
}

_resultMessages = [];

_coursesTopElems = setArrayTeElems(_coursesIds);
_eventsTopElems = setArrayTeElems(_eventsIds);
_testsTopElems = setArrayTeElems(_testsIds);

// Создать заголовок для таблицы,
// 1. Курсы, 2. Мероприятия, 3. Тесты
// В таком же порядке заполняется таблица
_tableTitle = setTableTitle(_coursesTopElems, _eventsTopElems, _testsTopElems);

_files = [];

// Set report data
for(_groupId in _groupsIds) {

    _trainingResultInfo = setTrainingResultInfo(_coursesIds, _eventsIds, _testsIds);

    try {
        _teGroup = tools.open_doc(_groupId).TopElem;
        _collaborators = _teGroup.collaborators;

        if(_positions != undefined) {
            
            _filterCollaborators = [];
            _includePositions = ArraySelect(_positions, "This.include == 'true'");

            if( ArrayCount(_includePositions) != 0 ) {

                _filterCollaborators = ArraySelectAll( XQuery("sql: SELECT id FROM collaborators where id IN ("+ArrayMerge(_collaborators, "XQueryLiteral(This.collaborator_id)", ",")+") AND position_name IN ("+ArrayMerge(_includePositions, "XQueryLiteral(This.position_name)", ",")+")") );

            } else {

                _excludePositions = ArraySelect(_positions, "This.include == 'false' || This.include == ''");

                if( ArrayCount(_excludePositions) != 0 ) {

                    _filterCollaborators = ArraySelectAll( XQuery("sql: SELECT id FROM collaborators where id IN ("+ArrayMerge(_collaborators, "XQueryLiteral(This.collaborator_id)", ",")+") AND position_name NOT IN ("+ArrayMerge(_excludePositions, "XQueryLiteral(This.position_name)", ",")+")") );
                }
            }

            if( ArrayCount(_filterCollaborators) != 0 ) {
                _collaborators = _filterCollaborators;
            } 
        } 
    
        _groupTitle = "<div><b>Отчет для группы: " + _teGroup.name + "</b><div>";
        _tableData = "";

        // Для процента по обученности
        _collsCounter = OptReal( ArrayCount(_collaborators) );
        
        for(_coll in _collaborators) {

            try {

                _colId = 0;

                try {
                    _colId = _coll.collaborator_id;
                } catch(e) {
                    _colId = _coll.id;
                }

                _teColl = tools.open_doc(_colId).TopElem;
                _experience = 0;

                try {
                    _experience = (DateDiff( Date(), Date(_teColl.hire_date))/86400);
                } catch(e) {
                    _date = _teColl.change_logs[ ArrayCount(_teColl.change_logs)-1 ].date;
                    _experience = (DateDiff( Date(), Date(_date))/86400);
                }
    
                _tableData += "<tr>";
                _tableData += "<td>"+ _teColl.fullname +"</td>"+
                    "<td>"+ _experience +"</td>"+
                    "<td>"+ _teColl.email +"</td>"+
                    "<td>"+ _teColl.position_name +"</td>"+
                "<td>"+ _teColl.position_parent_name +"</td>";

                // Данные для курсов
                if( ArrayCount(_coursesIds) != 0) {

                    for(_courseId in _coursesIds) {
        
                        _currentCourseCards = ArraySelect( _allCourses, "This.person_id==" + _teColl.id + " && This.course_id==" + _courseId );
            
                        _courseStatusInfo = getCourseTestStatusInfo(_currentCourseCards)
                        _tableData += "<td>"+ _courseStatusInfo.statusText +"</td>";
    
                        if(_courseStatusInfo.stateId == 4) {
                            _trainingResultInfo[_courseId]++;
                        }

                        if(_ignoreNotAssigned != undefined) {

                            if(_ignoreNotAssigned) {

                                if(_courseStatusInfo.stateId == -1) {
                                    _collsCounter--;
                                }
                            }
                        }
                    }
                }
                
                // Данные для мероприятий
                if( ArrayCount(_eventsIds) != 0) {

                    for(_eventId in _eventsIds) {
                        
                        _eventElem = ArrayOptFind(_allEvents, "This.event_type_id==" + _eventId + " && This.collaborator_id==" + _teColl.id);

                        if(_eventElem != undefined) {
                            _tableData += "<td>Присутствовал</td>";
                            _trainingResultInfo[_eventId]++;
                        } else {
                            _tableData += "<td>Не присутствовал</td>";
                        }
                    }
                }
                
                // Данные для тестов
                if( ArrayCount(_testsIds) != 0) {

                    for(_testId in _testsIds) {
        
                        _currentTestCards = ArraySelect( _allTests, "This.person_id==" + _teColl.id + " && This.assessment_id==" + _testId );
            
                        _testStatusInfo = getCourseTestStatusInfo(_currentCourseCards)
                        _tableData += "<td>"+ _testStatusInfo.statusText +"</td>";
    
                        if(_testStatusInfo.stateId == 4) {
                            _trainingResultInfo[_testId]++;
                        }

                        if(_ignoreNotAssigned != undefined) {

                            if(_ignoreNotAssigned) {

                                if(_testStatusInfo.stateId == -1) {
                                    _collsCounter--;
                                }
                            }
                        }
                    }
                }
        
                _tableData += "</tr>";

            } catch(e) {
                log("Ошибка при формировании данных по сотруднику ("+_coll.collaborator_id+"): " + e);
            }
        }

        _trainingResultMessage = "";

        // Процент по обученности для курсов
        for(_teCourse in _coursesTopElems) {

            _passedCounter = OptReal( _trainingResultInfo.GetProperty(_teCourse.id) );
            _percentage = StrReal( OptReal(_passedCounter/_collsCounter) * 100.0, 2);

            if(_calculateTotalPercentage) {
                _totalPercentage += OptReal(_percentage);
                _countTotalLearnings++;

                _learningTotal = ArrayOptFind(_totalPercentagesByLearning, "This.learningId==" + _teCourse.id);

                if(_learningTotal == undefined) {
                    _totalPercentagesByLearning.push({
                        learningId: _teCourse.id,
                        learningName: "курсу '" + _teCourse.name + "'",
                        percentage: OptReal(_percentage)
                    });
                } else {
                    _learningTotal.percentage += OptReal(_percentage);
                }
            }

            // _trainingResultMessage += "<div>Процент обученности по курсу '" + _teCourse.name + "': " + _percentage + "%<div>";
        }

        // Процент по обученности для мероприятий
        for(k = 0; k < ArrayCount(_eventsIds); k++) {

            _passedCounter = OptReal( _trainingResultInfo.GetProperty(_eventsIds[k]) );
            _percentage = StrReal( OptReal(_passedCounter/_collsCounter) * 100.0, 2);

            if(_calculateTotalPercentage) {
                _totalPercentage += OptReal(_percentage);
                _countTotalLearnings++;

                _learningTotal = ArrayOptFind(_totalPercentagesByLearning, "This.learningId==" + _eventsIds[k]);

                if(_learningTotal == undefined) {
                    _totalPercentagesByLearning.push({
                        learningId: _eventsIds[k],
                        learningName: "мероприятию '" + _eventsTopElems[k].name + "'",
                        percentage: OptReal(_percentage)
                    });
                } else {
                    _learningTotal.percentage += OptReal(_percentage);
                }
            }
            
            // _trainingResultMessage += "<div>Процент обученности по мероприятию '" + _eventsTopElems[k].name + "': " + _percentage + "%<div>";
        }

        // Процент по обученности для тестов
        for(_teTest in _testsTopElems) {

            _passedCounter = OptReal( _trainingResultInfo.GetProperty(_teTest.id) );
            _percentage = StrReal( OptReal(_passedCounter/_collsCounter) * 100.0, 2);

            if(_calculateTotalPercentage) {
                _totalPercentage += OptReal(_percentage);
                _countTotalLearnings++;

                _learningTotal = ArrayOptFind(_totalPercentagesByLearning, "This.learningId==" + _teTest.id);

                if(_learningTotal == undefined) {
                    _totalPercentagesByLearning.push({
                        learningId: _teTest.id,
                        learningName: "тесту '" + _teTest.name + "'",
                        percentage: OptReal(_percentage)
                    });
                } else {
                    _learningTotal.percentage += OptReal(_percentage);
                }
            }
            
            // _trainingResultMessage += "<div>Процент обученности по тесту '" + _teTest.name + "': " + Math.round(_percentage) + "%<div>";
            // _trainingResultMessage += "<div>Процент обученности по тесту '" + _teTest.name + "': " + _percentage + "%<div>";
        }
    
        _groupData = "<table style='font-size:8pt' border=1 cellspacing=1 cellpadding=1>" + _tableTitle + _tableData + "</table>";

        _resultMessages.push({
            groupId: _groupId,
            text: _groupTitle + "<br />" +_trainingResultMessage + "<br /><br />" 
        });

        _files.push({
            groupId: _groupId,
            data: _groupData,
            name: _teGroup.name + "_" + StrDate(Date(), false)
        });

    } catch(e) {
        log("Ошибка при формировании данных по группе ("+_groupId+"): " + e);
    }
}

if(_calculateTotalPercentage) {
    _totalPercentage = StrReal( OptReal(_totalPercentage)/OptReal(_countTotalLearnings), 2);

    for(_totalLearning in _totalPercentagesByLearning) {
        _totalLearning.percentage = StrReal( OptReal(_totalLearning.percentage)/OptReal( ArrayCount(_groupsIds) ) , 2)
    }
}

// Create notifications
if( _sendToFuncManagers && _sendToFuncManagers != 0 ) {

    for(_groupId in _groupsIds) {
        try {

            _teGroup = tools.open_doc(_groupId).TopElem;
            _funcManagers = _teGroup.func_managers;

            for(_funcManager in _funcManagers) {

                if( ArrayCount(_funcManagersTypeIds) != 0 ) {

                    _needToSend = undefined;

                    if(_funcManager.boss_type_id != null && _funcManager.boss_type_id != undefined) {
                        _needToSend = ArrayOptFind(_funcManagersTypeIds, "This==" + _funcManager.boss_type_id);
                    } 
                    
                    if(_needToSend != undefined) {

                        _resultFile = [];
                        _resultMessage = "";
                        
                        for(_file in _files) {

                            if(_file.groupId == _groupId) {

                                _resultFile.push(_file);
                            } 
                        }

                        for(_rm in _resultMessages) {

                            if(_rm.groupId == _groupId) {

                                _resultMessage = _rm.text;
                            } 
                        }

                        if(_calculateTotalPercentage && _calculateTotalPercentage != 0) {

                            // _resultMessage += "<b>Итоговый процент прохождения для всех групп:</b><br />"

                            for(_totalLearning in _totalPercentagesByLearning) {
                                // _resultMessage += "<div>Процент обученности по " + _totalLearning.learningName + ": " + _totalLearning.percentage + "%<div>";
                            }

                            // _resultMessage += "<div><b>Итоговый процент прохождения всех учебных активностей по всем группам:</b> "+_totalPercentage+"%<div>";
                        } 

                        _created = sendReport(_resultFile, _funcManager.person_id, _emailTitle, _resultMessage);
    
                        if(!_created) {
                            log("Не удалось отправить сообщение для " + _recipient );
                        }
                    }
                }
            }

        } catch(e) {
            log("Не удалось отправить сообщение для группы " + _groupId + " из-за ошибки: " + e );
        }   
    }

} else {
    for(_recipient in _emailRecipientsIds) {
        try {

            _resultMessage = "";

            for(_rm in _resultMessages) {
                _resultMessage += _rm.text;
            }

            if(_calculateTotalPercentage && _calculateTotalPercentage != 0) {

                // _resultMessage += "<b>Итоговый процент прохождения для всех групп:</b><br />"

                for(_totalLearning in _totalPercentagesByLearning) {
                    // _resultMessage += "<div>Процент обученности по " + _totalLearning.learningName + ": " + _totalLearning.percentage + "%<div>";
                }
                
                // _resultMessage += "<div><b>Итоговый процент прохождения всех учебных активностей по всем группам:</b> "+_totalPercentage+"%<div>";
            } 

            _created = sendReport(_files, _recipient, _emailTitle, _resultMessage);
    
            if(!_created) {
                log("Не удалось отправить сообщение для " + _recipient );
            }
            
        } catch(e) {
            log("Не удалось отправить сообщение для сотрудника " + _recipient + " из-за ошибки: " + e );
        }
    }
}