/* --------------- Functions --------------- */
var _log_tag = "360_report";
EnableLog(_log_tag);

function Log(message) {
    LogEvent(_log_tag, message);
}


function setCompetenceLine(oResult, oSelfCompetence, oManagerCompetence, collPas, staffPas, compIndex) {
    oResult.competenceName = getCompetenceName(oSelfCompetence);
    oResult.selfScore = replaceNumberSeparator( oSelfCompetence.mark_value);
    // oResult.managerScore = replaceNumberSeparator( oManagerCompetence.mark_value );

    if( oManagerCompetence != null )
    {
        oResult.managerScore = oManagerCompetence.mark_value != "N" ? replaceNumberSeparator( oManagerCompetence.mark_value ) : "N";
    }
    else
    {
        oResult.managerScore = 'N';
    }

    for(collPa in collPas) {
        oResult["coll_" + Int(collPa.expert_person_id)] = replaceNumberSeparator( collPa.competences[compIndex].mark_value );
    }

    for(staffPa in staffPas) {
        oResult["staff_" + Int(staffPa.expert_person_id)] = replaceNumberSeparator( staffPa.competences[compIndex].mark_value );
    }
}


function setIndicatorLine(oResult, oCompetence, oSelfIndicator, oManagerIndicator, collPas, staffPas, compIndex, indicIndex) {
    oResult.competenceName = getCompetenceName(oCompetence);
    oResult.indicatorName = getIndicatorName(oSelfIndicator);

    oResult.selfScore = oSelfIndicator.mark != "N" ? replaceNumberSeparator( oSelfIndicator.mark_value ) : "N";
    if( oManagerIndicator != null )
    {
        oResult.managerScore = oManagerIndicator.mark != "N" ? replaceNumberSeparator( oManagerIndicator.mark_value ) : "N";
    }
    else 
    {
        oResult.managerScore = 'N';
    }

    for(collPa in collPas) {
        _mark = collPa.competences[compIndex].indicators[indicIndex].mark;
        oResult["coll_" + Int(collPa.expert_person_id)] = _mark != "N" ? replaceNumberSeparator( collPa.competences[compIndex].indicators[indicIndex].mark_value ) : "N";
    }

    for(staffPa in staffPas) {
        _mark = staffPa.competences[compIndex].indicators[indicIndex].mark_value
        oResult["staff_" + Int(staffPa.expert_person_id)] = _mark != "N" ? replaceNumberSeparator( staffPa.competences[compIndex].indicators[indicIndex].mark_value ) : "N";
    }
}


function resetResultObject(
    PrimaryKey, 
    selfFullname, 
    managerFullname,
    selfPositionName,
    selfPositionParentName,
    selfOrgName,
    currentStageSelf,
    currentStageManager
    ) {
    return {
        PrimaryKey: PrimaryKey,
        selfFullname: selfFullname,
        managerFullname: managerFullname,
        selfPositionName: selfPositionName,
        selfPositionParentName: selfPositionParentName,
        selfOrgName: selfOrgName,
        currentStageSelf: currentStageSelf,
        currentStageManager: currentStageManager
    }
}

function getCompetenceName(oCompetence) {
    return tools.open_doc(oCompetence.competence_id).TopElem.name;
}


function getIndicatorName(oIndicator) {
    return tools.open_doc(oIndicator.indicator_id).TopElem.name;
}


function replaceNumberSeparator(number) {
    return StrReplace( String(number), '.', ',');
}


function setColumns(columns, collPas, staffPas) {

    columns.Clear();

    addColumn(columns, "Оцениваемый", "ListElem.selfFullname", "string");
    addColumn(columns, "Руководитель", "ListElem.managerFullname", "string");
    addColumn(columns, "Должность", "ListElem.selfPositionName", "string");
    addColumn(columns, "Подразделение", "ListElem.selfPositionParentName", "string");
    addColumn(columns, "Организация", "ListElem.selfOrgName", "string");
    addColumn(columns, "Текущий этап (Оцениваемый)", "ListElem.currentStageSelf", "string");
    addColumn(columns, "Текущий этап (Руководитель)", "ListElem.currentStageManager", "string");

    addColumn(columns, "Название компетенции", "ListElem.competenceName", "string");
    addColumn(columns, "Название индикатора", "ListElem.indicatorName", "string");
    addColumn(columns, "Оценка (Оцениваемый)", "ListElem.selfScore", "string");
    addColumn(columns, "Оценка (Руководитель)", "ListElem.managerScore", "string");

    for(collPa in collPas) {
        addColumn(columns, "Оценка (Коллега) " + collPa.expert_person_fullname, "ListElem." + "coll_" + Int(collPa.expert_person_id), "string");
    }

    for(staffPa in staffPas) {
        addColumn(columns, "Оценка (Подчиненный) " + staffPa.expert_person_fullname, "ListElem." + "staff_" + Int(staffPa.expert_person_id), "string");
    }
}


function addColumn(columns, columnTitle, columnValue, columnDataType) {
    column = columns.AddChild();

    column.flag_formula = true;
    column.column_title = columnTitle;
    column.column_value = columnValue;
    column.datatype = columnDataType;
}

/* --------------- Main program --------------- */

_RESULT = [];

APPR_ID = _CRITERIONS[0].value;
PERSON_ID = _CRITERIONS[1].value;
_usedPas = [];

var _pas_query = "for $pa in pas where $pa/assessment_appraise_id="+Int(APPR_ID)+" and $pa/person_id="+Int(PERSON_ID)+" return $pa"

Log("Pas query: " + _pas_query);

_pas = ArraySelectAll(XQuery(_pas_query));

try {

    // Инициализация карточек, нужных для отчета
    _selfPa = ArrayOptFind(_pas, "This.status=='self' && This.assessment_appraise_type=='competence_appraisal' && This.person_id == " + Int(PERSON_ID));


    _managerPa = ArrayOptFind(_pas, "This.status=='manager' && This.assessment_appraise_type=='competence_appraisal' && This.person_id == " + Int(PERSON_ID), undefined);

    Log(tools.object_to_text(_managerPa, 'json'));

    _collPas = ArraySelect(_pas, "This.status=='coll' && This.assessment_appraise_type=='competence_appraisal' && This.person_id == " + Int(PERSON_ID));
    _staffPas = ArraySelect(_pas, "This.status=='staff' && This.assessment_appraise_type=='competence_appraisal' && This.person_id == " + Int(PERSON_ID));

    _teCollPas = [];
    _teStaffPas = [];

    setColumns(columns, _collPas, _staffPas);

    for(_collPa in _collPas) {
        _teCollPas.push( tools.open_doc(_collPa.id).TopElem );
    }

    for(_staffPa in _staffPas) {
        _teStaffPas.push( tools.open_doc(_staffPa.id).TopElem );
    }


    _teSelfPa = tools.open_doc(_selfPa.id).TopElem;
    workflow_state_name = 'Этап не определен';
    if( _managerPa != undefined )
    {
        _teManagerPa = tools.open_doc(_managerPa.id).TopElem;
        _managerFullname = tools.open_doc(_teManagerPa.expert_person_id).TopElem.fullname;
        workflow_state_name = _teManagerPa.workflow_state_name;
    }
    else
    {
        _managerFullname = 'Нет оценки руковдителя';
    }
    _tePerson = tools.open_doc(_teSelfPa.person_id).TopElem;  

    alert("360: " + 1);

    _resultObject = resetResultObject(
        _tePerson.id,
        _tePerson.fullname,
        _managerFullname,
        _tePerson.position_name,
        _tePerson.position_parent_name,
        _tePerson.org_name,
        _teSelfPa.workflow_state_name,
        workflow_state_name
        // _teManagerPa.workflow_state_name
    );

    alert("360: " + 2);

    // Добавление основных компетенций и индикаторов в отчет
    for(i = 0; i < ArrayCount(_teSelfPa.competences); i++) {

        _resultObject = resetResultObject(
            _tePerson.id,
            _tePerson.fullname,
            _managerFullname,
            _tePerson.position_name,
            _tePerson.position_parent_name,
            _tePerson.org_name,
            _teSelfPa.workflow_state_name,
            workflow_state_name
            // _teManagerPa.workflow_state_name
        );

        _oSelfCompetence = _teSelfPa.competences[i];
        try
        {
            _oManagerCompetence = _teManagerPa.competences[i];
        }
        catch(ex)
        {
            _oManagerCompetence = null;
        }

        alert("360: " + 3);
        setCompetenceLine(_resultObject, _oSelfCompetence, _oManagerCompetence, _teCollPas, _teStaffPas, i);
        alert("360: " + 4);
        _RESULT.push(_resultObject);

        for(j = 0; j < ArrayCount(_oSelfCompetence.indicators); j++) {

            alert("360: " + 5);
            
            _resultObject = resetResultObject(
                _tePerson.id,
                _tePerson.fullname,
                _managerFullname,
                _tePerson.position_name,
                _tePerson.position_parent_name,
                _tePerson.org_name,
                _teSelfPa.workflow_state_name,
                workflow_state_name
                // _teManagerPa.workflow_state_name
            );

            _oSelfIndicator = _oSelfCompetence.indicators[j];
            // _oManagerIndicator = _oManagerCompetence.indicators[j];
            try
            {
                _oManagerIndicator = _oManagerCompetence.indicators[j];
            }
            catch(ex)
            {
                _oManagerIndicator = null;
            }
    

            setIndicatorLine(_resultObject, _oSelfCompetence, _oSelfIndicator, _oManagerIndicator, _teCollPas, _teStaffPas, i, j);

            alert("360: " + 6);
            _RESULT.push(_resultObject);
        }
    }

    alert("360: " + 7);

    _resultObject = resetResultObject(
        _tePerson.id,
        _tePerson.fullname,
        _managerFullname,
        _tePerson.position_name,
        _tePerson.position_parent_name,
        _tePerson.org_name,
        _teSelfPa.workflow_state_name,
        workflow_state_name
        // _teManagerPa.workflow_state_name
    );

    _resultObject.competenceName = "Итоговая оценка";
    _resultObject.selfScore = replaceNumberSeparator(_teSelfPa.overall);
    try
    {
        _resultObject.managerScore = replaceNumberSeparator(_teManagerPa.overall);
    }
    catch(ex)
    {
        _resultObject.managerScore = 'N';
    }

    for(_teCollPa in _teCollPas) {
        _resultObject["coll_" + Int(_teCollPa.expert_person_id )] = replaceNumberSeparator( _teCollPa.overall );
    }

    for(_teStaffPa in _teStaffPas) {
        _resultObject["staff_" + Int(_teStaffPa.expert_person_id)] = replaceNumberSeparator( _teStaffPa.overall );
    }

    _RESULT.push(_resultObject);

    alert("360: " + 8);
}
catch(e) 
{
    Log(String(e));
    alert(e);
}
return _RESULT;