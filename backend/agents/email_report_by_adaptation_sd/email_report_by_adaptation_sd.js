/* --------------- Log --------------- */

EnableLog('reports_email_sd', true);
// EnableLog('/reports_email/main', true);

function log(message) {
    LogEvent('reports_email_sd', message);
}


/* --------------- Using --------------- */

function using(lib) {
    path = "x-app://custom_libs/";

    DropFormsCache(path + lib + ".js");
    return OpenCodeLib(path + lib + ".js"); 
}

var date_lib = using("date_lib");


/* --------------- Functions --------------- */

function setTableTitle(allTasks, showTutorPercentage, showReadinesPercent) {

    _resultTitle = "<tr><th rowspan='2'>ФИО сотрудника</th>"+
        "<th rowspan='2'>Руководители</th>"+
        "<th rowspan='2'>Наставники</th>"+
        "<th rowspan='2'>Дата приёма</th>"+
        "<th rowspan='2'>Стаж (дней)</th>"+
        "<th rowspan='2'>Почта</th>"+
        "<th rowspan='2'>Должность</th>"+
        "<th rowspan='2'>Подразделение</th>";

    // Срок назначения и длительность
    for(taskElem in allTasks) {

        _resultTitle += "<th>На "+ taskElem.due_date +" день ("+taskElem.duration_days+" дней)</th>";
    }

    if(showReadinesPercent) {
        _resultTitle += "<th rowspan='2'>Процент прохождения стажером - факт</th>"+
        "<th rowspan='2'>Процент прохождения стажером - план</th>"

        if(showTutorPercentage) {
            _resultTitle += "<th rowspan='2'>Процент прохождения наставником - факт</th>"+
            "<th rowspan='2'>Процент прохождения наставником - план</th>";
        }
    }

    _resultTitle += "</tr><tr>";

    // Названия мероприятий
    for(taskElem in allTasks) {

        _resultTitle += "<th>"+ taskElem.name +"</th>";
    }

    _resultTitle += "</tr>";

    return _resultTitle;
}


function getTdStatus(status) {

    switch(status) {
        case "plan":
            return "<td>Планируется</td>";
        case "active":
            return "<td>В работе</td>";
        case "passed":
            return "<td bgcolor='#48db04'>Выполнен успешно</td>";
        case "failed":
            return "<td bgcolor='#f70202'>Выполнен неуспешно";
        case "cancel":
            return "<td bgcolor='#858585'>Отменен</td>";
    }
}


function sendReport(fileElem, personId, title, bodyText) {

    var newNotify = OpenNewDoc ('x-local://wtv/wtv_dlg_notification_template.xml').TopElem;

    newNotify.recipients.AddChild().recipient_type = 'in_doc'; // отправление сообщения сотруднику
    newNotify.subject = title;
    newNotify.body_type = 'html';
    newNotify.body = bodyText;

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

    successSent = tools.create_notification( '0', Int(personId), '', null, null, null, newNotify);
    return successSent;
}


function getFilterTasks(allTasks, filterIds) {
    
    resultTasks = [];
    filtersArray = [];

    if(filterIds  != "") {
        filtersArray = filterIds.split(";");
    }

    if( ArrayCount(filtersArray) != 0 ) {

        for(filterElem in filtersArray) {

            resultTask = ArrayOptFind(allTasks, "This.id=="+ XQueryLiteral(filterElem));

            if(resultTask != undefined) {
                resultTasks.push(resultTask);   
            }
        }
    } else {

        resultTasks = ArraySelect(allTasks, "This.type != 'stage'");
    }

    return resultTasks;
}



/* --------------- Main Program --------------- */

_typicalDevProgramId = Param.typical_dev_program_id;
_groups = tools_web.parse_multiple_parameter(Param.groups);
_emailTitle = Param.email_title;
_emailRecipientsIds = tools_web.parse_multiple_parameter(Param.email_recipients);
_xmCareerReserves = undefined;
_mailText = "";
_showReadinesPercent = true;

if( Param.HasProperty("mail_text") ) {
    _mailText = Param.mail_text;
}

if( Param.HasProperty("show_readines_percent") ) {
    _showReadinesPercent = String(Param.show_readines_percent) == "true";
}

if( ArrayCount(_groups) != 0 ) {
    _xmCareerReserves = ArraySelectAll(XQuery("for $cr in career_reserves, $col in collaborators, $gc in group_collaborators where "+
        "($cr/status='active' or $cr/status='plan') and "+
        "$col/is_dismiss = false() and $cr/person_id = $col/id and "+
        "MatchSome($gc/group_id, ("+ArrayMerge(_groups, "This", ",")+")) and $gc/collaborator_id=$col/id and " +
        "(doc-contains( $cr/id, 'wt_data', '[typical_dev_program_id = "+Int(_typicalDevProgramId)+"]') or " +
        "doc-contains( $cr/id, 'wt_data', '[typical_dev_program_id = '"+StrHexInt( Int(_typicalDevProgramId), 16 )+"']')) and $cr/start_date > date('"+DateOffset(Date(), -86400 * 365)+"') order by $col/hire_date descending return $cr"));

        
} else {
    _xmCareerReserves = ArraySelectAll(XQuery("for $cr in career_reserves, $col in collaborators where "+
        "($cr/status='active' or $cr/status='plan') and "+
        "$col/is_dismiss = false() and $cr/person_id = $col/id and "+
        "(doc-contains( $cr/id, 'wt_data', '[typical_dev_program_id = "+Int(_typicalDevProgramId)+"]') or " +
        "doc-contains( $cr/id, 'wt_data', '[typical_dev_program_id = '"+StrHexInt( Int(_typicalDevProgramId), 16 )+"']')) and $cr/start_date > date('"+DateOffset(Date(), -86400 * 365)+"') order by $col/hire_date descending return $cr"));
}

log(tools.object_to_text(_xmCareerReserves, "json"))

// _teDevProgram = tools.open_doc(_typicalDevProgramId).TopElem;
// _devProgramTasks = _teDevProgram.tasks;

// // Отфильтровать задачи (если есть фильтр)
// _filterTaskIds = Param.filter_task_ids
// _filterTasks = getFilterTasks(_devProgramTasks, _filterTaskIds);
// _showTutorPercentage = _filterTaskIds != "";

// // Задать заголовки для таблицы
// _tableTitle = setTableTitle(_filterTasks, _showTutorPercentage, _showReadinesPercent);
// _tableData  = "";

// for(_careerReserve in _xmCareerReserves)
// {
// 	try
// 	{
// 		_planPassedInternCounter = 0;
// 		_factPassedInternCounter = 0;
// 		_planPassedManagerCounter = 0;

// 		_teCareerReserve = tools.open_doc(_careerReserve.id).TopElem;

// 		_teColl = tools.open_doc(_teCareerReserve.person_id).TopElem;
// 		_experience = 0;
// 		_hireDate = "";
// 		_tutors = "";
// 		_funcManagers = "";

// 		// Руководители
// 		if(ArrayCount(_teColl.func_managers) == 0) {
// 			_funcManagers = "-";
// 		} else {
// 			for(_funcManager in _teColl.func_managers) {
// 				_funcManagers += _funcManager.person_fullname + "; ";
// 			}
// 		}


// 		// Наставники
// 		if(ArrayCount(_teCareerReserve.tutors) == 0) {
// 			_tutors = "-";
// 		} else {
// 			for(_tutor in _teCareerReserve.tutors) {
// 				_tutors += _tutor.person_fullname + "; ";
// 			}
// 		}

// 		// Дата приёма и стаж
// 		try {
// 			_experience = (DateDiff( Date(), Date(_teColl.hire_date))/86400);
// 			_hireDate = StrDate( Date(_teColl.hire_date), false );
// 		} catch(e) {
// 			_date = _teColl.change_logs[ ArrayCount(_teColl.change_logs)-1 ].date;
// 			_experience = (DateDiff( Date(), Date(_date))/86400);
// 			_hireDate = StrDate(Date(_date), false);
// 		}

// 		_tableData += "<tr>";
// 		_tableData += "<td>"+ _teColl.fullname +"</td>"+
// 			"<td>"+ _funcManagers +"</td>"+
// 			"<td>"+ _tutors +"</td>"+
// 			"<td>"+ _hireDate +"</td>"+
// 			"<td>"+ _experience +"</td>"+
// 			"<td>"+ _teColl.email +"</td>"+
// 			"<td>"+ _teColl.position_name +"</td>"+
// 		"<td>"+ _teColl.position_parent_name +"</td>";


// 		for(_taskElem in _filterTasks) {

// 			_currentTask = undefined;

// 			if(_teCareerReserve.tasks[0].typical_development_program_task_id != "") {

// 				_currentTask = ArrayOptFind(_teCareerReserve.tasks, "This.typical_development_program_task_id==" + XQueryLiteral(_taskElem.id));
// 			} else {
// 				_currentTask = ArrayOptFind(_teCareerReserve.tasks, "This.id==" + XQueryLiteral(_taskElem.id));
// 			}

// 			if(_currentTask != undefined) {

// 				_planDate = _currentTask.plan_date;

// 				if(_planDate != undefined && _planDate != null && _planDate != "") {

// 					if( date_lib.dateIsGreater(Date(), Date(_planDate), false) && (_currentTask.status != "passed" && _currentTask.status != "cancel" ) ) {
// 						_tableData += "<td bgcolor='#bdbdbd'>Просрочено</td>"
// 					} else {
// 						_tableData += getTdStatus(_currentTask.status);
// 					}
// 				} else {
// 					_tableData += getTdStatus(_currentTask.status);
// 				}
				

// 				if(_currentTask.status == 'passed') {
// 					_factPassedInternCounter++;
// 				}

// 				try {
// 					if( date_lib.dateIsGreater(Date(), Date(_currentTask.plan_date), false) ) {
// 						_planPassedInternCounter++;
// 					}
// 				} catch(e) {
// 					log(e);
// 				}

// 			} else {
// 				_tableData  += "<td bgcolor='#bdbdbd'>-</td>";
// 			}
// 		}

// 		_taskCounter = 0;
// 		// Плановое заполнение наставником
// 		for(_task in _teCareerReserve.tasks) {

// 			try {
// 				if(_task.type != "stage") {
// 					_taskCounter++;

// 					if( date_lib.dateIsGreater(Date(), Date(_task.plan_date), false) ) {
// 						_planPassedManagerCounter++;
// 					}
// 				}
// 			} catch(e) {
// 				log(e);
// 			}
// 		}

// 		if(_showReadinesPercent) {
// 			_tableData += "<td>"+ StrReal( OptReal( OptReal(_factPassedInternCounter) / OptReal(ArrayCount(_filterTasks))) * 100.0, 0) +"%</td>";
// 			_tableData += "<td>"+ StrReal( OptReal( OptReal(_planPassedInternCounter) / OptReal(ArrayCount(_filterTasks))) * 100.0, 0) +"%</td>";
		
// 			if(_showTutorPercentage) {
// 				_tableData += "<td>"+ _teCareerReserve.readiness_percent +"%</td>";
// 				_tableData += "<td>"+ StrReal( OptReal( OptReal(_planPassedManagerCounter) / OptReal(_taskCounter)) * 100.0, 0) +"%</td>";
// 			}
// 		}

// 		_tableData += "</tr>";
// 	}
// 	catch(e)
// 	{
// 		log("Ошибка при формировании строки отчета для " + _careerReserve.id + ", ошибка: " + e);
// 	}
// }


// _crData = "<table style='font-size:8pt' border=1 cellspacing=1 cellpadding=1>" + _tableTitle + _tableData + "</table>";
// _file = {
//     data: _crData,
//     name: _emailTitle + "_" + StrDate(Date(), false)
// };


// // Send Reports
// for(_recipient in _emailRecipientsIds) {
//     try {

//         _created = sendReport(_file, _recipient, _emailTitle, _mailText);

//         if(!_created) {
//             log("Не удалось отправить сообщение для " + _recipient );
//         }
        
//     } catch(e) {
//         log("Не удалось отправить сообщение для сотрудника " + _recipient + " из-за ошибки: " + e );
//     }
// }