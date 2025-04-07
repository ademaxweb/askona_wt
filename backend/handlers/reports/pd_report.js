/* --------------- Functions --------------- */
Request.RespContentType = 'application/json';

var _log_tag = "pd_report";
EnableLog(_log_tag);

function Log(message) {
    LogEvent(_log_tag, message);
}

function SendResponse(success, message, data) {
    Response.Write(tools.object_to_text({
        success: success,
        message: message,
        data: data
    }, "json"))
}

function StringifyObjectValues(obj) {
    for (k in obj) {
        obj[k] = String(obj[k]);
    }
    return obj
}


function columnsInit(columns, competencesElems, cenElem, kpisTasks) {
    addColumn(columns, "ФИО оцениваемого", "selfFullname", "string");
    addColumn(columns, "ФИО оценивающего руководителя", "managerFullname", "string");
    addColumn(columns, "Должность", "selfPositionName", "string");
    addColumn(columns, "Подразделение", "selfPositionParentName", "string");
    addColumn(columns, "Организация", "selfOrgName", "string");
    addColumn(columns, "Текущий этап", "currentStage", "string");
    addColumn(columns, "Итоговая оценка (Цифра)", "overall_number", "string");
    addColumn(columns, "Итоговая оценка (Буква)", "overall_letter", "string");

    setKpisColumns(columns, kpisTasks);

    setCenColumns(columns, cenElem, "self");
    addColumn(columns, "Итоговый балл - ценности (Самооценка)", "total_mark_cen_self", "string");
    setCompetencesColumns(columns, competencesElems, "self");
    addColumn(columns, "Итоговый балл - компетенции (Самооценка)", "total_mark_self", "string");

    setCenColumns(columns, cenElem, "manager");
    addColumn(columns, "Итоговый балл - ценности (Оценка руководителем)", "total_mark_cen_manager", "string");
    setCompetencesColumns(columns, competencesElems, "manager");
    addColumn(columns, "Итоговый балл - компетеции (Оценка руководителем)", "total_mark_manager", "string");
}


function setKpisColumns(columns, kpisTasks) {

    addColumn(columns, "Бюджетный период", "budget_period", "string");
    addColumn(columns, "Показатели", "kpi_tasks", "string");

    // for(taskElem in kpisTasks) 
    // {
    //     taskName = taskElem.task_id.OptForeignElem.name;
    //     addColumn(columns, "KPI: " + taskName, "ListElem.kpi_task_" + taskElem.task_id, "string");
    // }

    addColumn(columns, "KPI: Оценка руководителя", "kpi_result_mark", "string");
}


function setCenColumns(columns, cenElem, prefix) {

    indicatorCounter = 0;
    statusPa = prefix == "self" ? "Самооценка" : "Оценка руководителем";

    for(j = 0; j < ArrayCount(cenElem.indicators); j++) {

        _indicator = cenElem.indicators[j].indicator_id.OptForeignElem;
        if(_indicator == undefined)
        {
            try
            {
                _indicator = tools.open_doc(cenElem.indicators[j].indicator_id).TopElem;
            }
            catch(e)
            {
                continue;
            }
        }

        addColumn(columns, _indicator.name + ": ("+statusPa+")" , prefix +"cenIndicatorScore_" + cenElem.indicators[j].indicator_id, "string");
        indicatorCounter++;
    }
}


function setCompetencesColumns(columns, competencesElems, prefix) {

    competenceCounter = 0;
    indicatorCounter = 0;
    statusPa = prefix == "self" ? "Самооценка" : "Оценка руководителем";

    for(i = 0; i < ArrayCount(competencesElems); i++) {

        _competence = competencesElems[i].competence_id.OptForeignElem;
        if(_competence == undefined)
        {
            try
            {
                _competence = tools.open_doc(competencesElems[i].competence_id).TopElem;
            }
            catch(e)
            {
                continue;
            }
        }

        addColumn(columns, _competence.name + " - общий балл ("+statusPa+"): ", prefix +"CompetenceScore_" + competencesElems[i].competence_id, "string");
        competenceCounter++;      

        for(j = 0; j < ArrayCount(competencesElems[i].indicators); j++) {

            _indicator = competencesElems[i].indicators[j].indicator_id.OptForeignElem;
            if(_indicator == undefined)
            {
                try
                {
                    _indicator = tools.open_doc(competencesElems[i].indicators[j].indicator_id).TopElem;
                }
                catch(e)
                {
                    continue;
                }
            }

            addColumn(columns, _indicator.name + ": (Самооценка)" , prefix +"indicatorScore_" + competencesElems[i].indicators[j].indicator_id, "string");
            indicatorCounter++;
        }
    }
}


function addColumn(columns, columnTitle, columnValue, columnDataType) {
    columns.push(
        {
            flag_formula: true,
            key: columnValue,
            value: columnTitle,
            type: columnDataType
        }
    )
}


function fillTasksInfo(resultObject, teSelfPa, teManagerPa, teKpisPa) {

    // KPI
    budPeriod = "";
    try {
        budPeriod = tools.open_doc(teKpisPa.budget_period_id).TopElem.name;
    } catch(e) { alert(e); }

    kpiResultMark = ArrayCount(teKpisPa.supplementary_questions) != 0 ? teKpisPa.supplementary_questions[0].supplementary_question_mark : "";

    resultObject["budget_period"] = budPeriod;
    resultObject["kpi_tasks"] = "";
    kpiTaskNumber = 1;

    for(kpiTaskElem in teKpisPa.tasks) 
    {
        teTask = tools.open_doc(kpiTaskElem.task_id).TopElem;

        alert("teTask.name: " + teTask.name);

        resultObject["kpi_tasks"] += kpiTaskNumber + ". " +teTask.name + ": " +  teTask.fact + "; \n";
        kpiTaskNumber++;
    }
    resultObject["kpi_result_mark"] = kpiResultMark;


    // SELF - CEN
    indicatorCounter = 0;

    cenTask = ArrayOptFind(teSelfPa.competences, "This.competence_id ==" + 7336112817429042608);
    cenSelfTotalMark = 0;

    for(j = 0; j < ArrayCount(cenTask.indicators); j++) {
        resultObject["selfcenIndicatorScore_" + cenTask.indicators[j].indicator_id] = cenTask.indicators[j].mark_value;
        cenSelfTotalMark += OptReal(cenTask.indicators[j].mark_value, 0);
        indicatorCounter++;
    }

    resultObject["total_mark_cen_self"] = replaceNumberSeparator(cenSelfTotalMark/ArrayCount(cenTask.indicators));


    // SELF - COMP
    competenceCounter = 0;
    indicatorCounter = 0;

    for(i = 0; i < ArrayCount(teSelfPa.competences); i++) {

        resultObject["self" + "CompetenceScore_" + teSelfPa.competences[i].competence_id] = replaceNumberSeparator(teSelfPa.competences[i].mark_value);
        competenceCounter++;

        for(j = 0; j < ArrayCount(teSelfPa.competences[i].indicators); j++) {
            resultObject["self" + "indicatorScore_" + teSelfPa.competences[i].indicators[j].indicator_id] = teSelfPa.competences[i].indicators[j].mark_value;
            indicatorCounter++;
        }
    }

    resultObject["total_mark_self"] = replaceNumberSeparator(teSelfPa.overall);


    // MANAGER - CEN
    indicatorCounter = 0;
    cenManagerTotalMark = 0;

    cenTask = ArrayOptFind(teManagerPa.competences, "This.competence_id ==" + 7336112817429042608);

    for(j = 0; j < ArrayCount(cenTask.indicators); j++) {
        resultObject["managercenIndicatorScore_" + cenTask.indicators[j].indicator_id] = cenTask.indicators[j].mark_value;
        cenManagerTotalMark += OptReal(cenTask.indicators[j].mark_value, 0);
        indicatorCounter++;
    }

    resultObject["total_mark_cen_manager"] = replaceNumberSeparator(cenManagerTotalMark/ArrayCount(cenTask.indicators));


    // MANAGER - COMP
    competenceCounter = 0;
    indicatorCounter = 0;

    for(i = 0; i < ArrayCount(teManagerPa.competences); i++) {

        resultObject["manager" + "CompetenceScore_" + teManagerPa.competences[i].competence_id] = replaceNumberSeparator(teManagerPa.competences[i].mark_value);
        competenceCounter++;

        for(j = 0; j < ArrayCount(teManagerPa.competences[i].indicators); j++) {
            resultObject["manager" + "indicatorScore_" + teManagerPa.competences[i].indicators[j].indicator_id] = teManagerPa.competences[i].indicators[j].mark_value;
            indicatorCounter++;
        }
    }

    resultObject["total_mark_manager"] = replaceNumberSeparator(teManagerPa.overall);

    // Overall

    kpiMark = getKpiMarkValue(kpiResultMark);
    compMark = (OptReal(teSelfPa.overall, 0) + OptReal(teManagerPa.overall, 0))/2;
    cenMark = (OptReal(resultObject["total_mark_cen_manager"], 0) + OptReal(resultObject["total_mark_cen_self"], 0))/2;

    resultObject["overall_number"] = replaceNumberSeparator((kpiMark * 0.3) + (cenMark * 0.3) + (compMark * 0.4));
    resultObject["overall_letter"] = getLetterMark(resultObject["overall_number"]);
}


function getKpiMarkValue(markLetter) {

    switch(markLetter) {
        case "A": return 3;
        case "B": return 2;
        case "C": return 1;
        default: return 0;
    }
}


function replaceNumberSeparator(number) {
    // return StrReplace( String(number), '.', ',');
    return number;
}


function getLetterMark(markValue) {

    markLetter = "";
    markValue = OptReal(markValue, 0);

    if(markValue >= 2.5 && markValue <= 3) {
        markLetter = "A";
    } 
    else if(markValue >= 2 && markValue <= 2.49) {
        markLetter = "B";
    }
    else if(markValue >= 1 && markValue <= 1.99) {
        markLetter = "C";
    }
    else if(markValue >= 0 && markValue <= 0.99) {
        markLetter = "D";
    }

    return markLetter;
}


/* --------------- Main program --------------- */
try
{
    // _RESULT = [];
    // APPR_ID = _CRITERIONS[0].value;

    APPR_ID = Request.Query.GetOptProperty("appr_id", null);

    if (APPR_ID == null)
    {
        throw "Не указана процедура оценки";
    }

    _columns = [];
    _rows = [];

    _assessmentPlans = ArraySelectAll(XQuery("for $ap in assessment_plans where $ap/assessment_appraise_id="+ APPR_ID +" return $ap"));
    _columnsInit = false;

    for(_assessmentPlan in _assessmentPlans) {

        try {
            _pas = ArraySelectAll(XQuery("for $pa in pas where $pa/assessment_plan_id = "+_assessmentPlan.id+" return $pa"));

            // Инициализация карточек, нужных для отчета
            _selfPa = ArrayOptFind(_pas, "This.status=='self' && This.assessment_appraise_type=='competence_appraisal'");
            _managerPa = ArrayOptFind(_pas, "This.status=='manager' && This.assessment_appraise_type=='competence_appraisal'");
            _kpisPa = ArrayOptFind(_pas, "This.assessment_appraise_type=='activity_appraisal'");
        
            _teSelfPa = tools.open_doc(_selfPa.id).TopElem;
            _teManagerPa = tools.open_doc(_managerPa.id).TopElem;
            _teKpisPa = tools.open_doc(_kpisPa.id).TopElem;
            _tePerson = tools.open_doc(_teSelfPa.person_id).TopElem;
        
            _competences = [];
            _cen = undefined;
        
            _tmpComp = _teSelfPa.competences;
        
            for(_comp in _tmpComp) {
        
                if(_comp.competence_id == 7336112817429042608) {
                    _cen = _comp;
                } else {
                    _competences.push(_comp);
                }
            }
        
            if( !_columnsInit ) {
                columnsInit(_columns, _competences, _cen, _teKpisPa.tasks);
                _columnsInit = true;
            }
        
            _resultObject = {};
        
            _tePerson = tools.open_doc(_teSelfPa.person_id).TopElem;
        
            _resultObject["PrimaryKey"] = _tePerson.id;
            _resultObject["selfFullname"] = _tePerson.fullname;
            _resultObject["managerFullname"] = tools.open_doc(_teManagerPa.expert_person_id).TopElem.fullname;
            _resultObject["selfPositionName"] = _tePerson.position_name;
            _resultObject["selfPositionParentName"] = _tePerson.position_parent_name;
            _resultObject["selfOrgName"] = _tePerson.org_name;
            _resultObject["currentStage"] = _assessmentPlan.workflow_state_name;
        
            fillTasksInfo(_resultObject, _teSelfPa, _teManagerPa, _teKpisPa);
        
            _rows.push(StringifyObjectValues(_resultObject));

        }
        catch(e) 
        {
            Log(String(e));
        }
    }

    SendResponse(
        true,
        "Отчет успешно сформирован",
        {
            columns: _columns,
            rows: _rows
        }
    )
}
catch (err)
{
    SendResponse(false, err.message, String(err))
}