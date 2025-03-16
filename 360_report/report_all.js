/* --------------- Functions --------------- */
_log_tag = "360_report_all";
EnableLog(_log_tag);


function Log(message) {
    LogEvent(_log_tag, message);
}


function setCompetenceLine(oResult, oSelfCompetence, oManagerCompetence, collPas, staffPas, compIndex) {
    oResult.competenceName = getCompetenceName(oSelfCompetence);
    oResult.selfScore = replaceNumberSeparator( oSelfCompetence.mark_value);

    try
    {
        manager_competence_mark_value = oManagerCompetence.mark_value
    }
    catch(e)
    {
        manager_competence_mark_value = 0.0;
    }


    try
    {
        oResult.managerScore = replaceNumberSeparator( manager_competence_mark_value );
    }
    catch (e)
    {
        oResult.managerScore = 0.0;
    }

    totalColls = 0.0;
    totalStaffs = 0.0;

    averageColls = 0.0;
    averageStaffs = 0.0;
    averageAll = 0.0;
    averageAll_minus_self = 0.0;

    collsCounter = 0;
    staffsCounter = 0;

    // Average colls
    for(collPa in collPas) {

        if(collPa.is_done) {
            if(collPa.competences[compIndex].mark != "") {
                totalColls += OptReal(collPa.competences[compIndex].mark_value);
                collsCounter++;
            }
        }
    }

    if(collsCounter != 0) {
        averageColls = OptReal(totalColls) / OptReal(collsCounter);
    } else {
        averageColls = "N";
    }

    // Average staffs
    for(staffPa in staffPas) {

        if(staffPa.is_done) {
            totalStaffs += OptReal(staffPa.competences[compIndex].mark_value);
            staffsCounter++;
        }
    }

    if(staffsCounter != 0) {
        averageStaffs = OptReal(totalStaffs) / OptReal(staffsCounter);
    } else {
        averageStaffs = "N";
    }
    

    // Average all
    averageAll = (OptReal(oSelfCompetence.mark_value) + OptReal(manager_competence_mark_value) + totalStaffs + totalColls) / (2 + staffsCounter + collsCounter);

    // Average all minus self
    averageAll_minus_self = (OptReal(manager_competence_mark_value, 0) + totalStaffs + totalColls) / (1 + staffsCounter + collsCounter);

    if(averageColls != "N") {
        oResult.averageColls = replaceNumberSeparator( StrReal(averageColls, 2) );
    } else {
        oResult.averageColls = averageColls;
    }

    if(averageStaffs != "N") {
        oResult.averageStaffs = replaceNumberSeparator( StrReal(averageStaffs, 2) );
    } else {
        oResult.averageStaffs = averageStaffs;
    }

    oResult.averageAll = replaceNumberSeparator( StrReal(averageAll, 2) );
    oResult.averageAll_minus_self = replaceNumberSeparator( StrReal(averageAll_minus_self, 2) );
}


function setIndicatorLine(oResult, oCompetence, oSelfIndicator, oManagerIndicator, collPas, staffPas, compIndex, indicIndex) {
    oResult.competenceName = getCompetenceName(oCompetence);
    oResult.indicatorName = getIndicatorName(oSelfIndicator);

    oResult.selfScore = oSelfIndicator.mark != "N" ? replaceNumberSeparator( oSelfIndicator.mark_value ) : "N";
    // oResult.managerScore = oManagerIndicator.mark != "N" ? replaceNumberSeparator( oManagerIndicator.mark_value ) : "N";

    if( oManagerIndicator != null )
    {
        oResult.managerScore = oManagerIndicator.mark != "N" ? replaceNumberSeparator( oManagerIndicator.mark_value ) : "N";
    }
    else 
    {
        oResult.managerScore = 'N';
    }

    totalColls = 0.0;
    totalStaffs = 0.0;

    averageColls = 0.0;
    averageStaffs = 0.0;
    averageAll = 0.0;
    averageAll_minus_self = 0.0;

    collsCounter = 0;
    staffsCounter = 0;

    // Average colls
    for(collPa in collPas) {

        if(collPa.is_done) {
            
            _mark = collPa.competences[compIndex].indicators[indicIndex].mark;

            if(_mark != "N") {

                markValue = OptReal( collPa.competences[compIndex].indicators[indicIndex].mark_value );
                totalColls += markValue;
                collsCounter++;
            }
        }
    }

    if(collsCounter != 0) {
        averageColls = OptReal(totalColls) / OptReal(collsCounter);
    } else {
        averageColls = "N";
    }
    

    // Average staffs
    for(staffPa in staffPas) {

        if(staffPa.is_done) {

            _mark = staffPa.competences[compIndex].indicators[indicIndex].mark;

            if(_mark != "N") {

                markValue = OptReal( staffPa.competences[compIndex].indicators[indicIndex].mark_value );
                totalStaffs += OptReal(staffPa.competences[compIndex].mark_value);
                staffsCounter++;
            }

        }
    }

    if(staffsCounter != 0) {
        averageStaffs = OptReal(totalStaffs) / OptReal(staffsCounter);
    } else {
        averageStaffs = "N";
    }

    // Average all
    selfInd = oSelfIndicator.mark != "N" ? OptReal( oSelfIndicator.mark_value ) : 0.0;
    try
    {
        managerInd = oManagerIndicator.mark != "N" ? OptReal( oManagerIndicator.mark_value ) : 0.0;
    }
    catch(ex)
    {
        managerInd = 0.0;
    }
    additionalCounter = 2;

    if(oSelfIndicator.mark == "N") {
        additionalCounter--;
    }

    if( oManagerIndicator != null && oManagerIndicator.mark == "N" ) {
        additionalCounter--;
    }

    averageAll = (OptReal(selfInd) + OptReal(managerInd) + totalStaffs + totalColls) / (additionalCounter + staffsCounter + collsCounter);

    // Average all minus self
    additionalCounter = 1;

    if( oManagerIndicator != null && oManagerIndicator.mark == "N" ) {
        additionalCounter--;
    }

    averageAll_minus_self = (OptReal(managerInd) + totalStaffs + totalColls) / (additionalCounter + staffsCounter + collsCounter);

    if(averageColls != "N") {
        oResult.averageColls = replaceNumberSeparator( StrReal(averageColls, 2) );
    } else {
        oResult.averageColls = averageColls;
    }

    if(averageStaffs != "N") {
        oResult.averageStaffs = replaceNumberSeparator( StrReal(averageStaffs, 2) );
    } else {
        oResult.averageStaffs = averageStaffs;
    }

    oResult.averageAll = replaceNumberSeparator( StrReal(averageAll, 2) );
    oResult.averageAll_minus_self = replaceNumberSeparator( StrReal(averageAll_minus_self, 2) );
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


/* --------------- Main program --------------- */

_RESULT = [];

APPR_ID = _CRITERIONS[0].value;
_usedPas = [];

_assessmentPlans = ArraySelectAll(XQuery("for $ap in assessment_plans where $ap/assessment_appraise_id="+Int(APPR_ID)+" return $ap"));

for(_assessmentPlan in _assessmentPlans) {

    try {

        _pas = ArraySelectAll(XQuery("for $pa in pas where $pa/assessment_plan_id="+Int(_assessmentPlan.id)+" return $pa"));

        // Инициализация карточек, нужных для отчета
        _selfPa = ArrayOptFind(_pas, "This.status=='self' && This.assessment_appraise_type=='competence_appraisal'");
        _managerPa = ArrayOptFind(_pas, "This.status=='manager' && This.assessment_appraise_type=='competence_appraisal'", undefined);

        _collPas = ArraySelect(_pas, "This.status=='coll' && This.assessment_appraise_type=='competence_appraisal'");
        _staffPas = ArraySelect(_pas, "This.status=='staff' && This.assessment_appraise_type=='competence_appraisal'");

        _teCollPas = [];
        _teStaffPas = [];

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

        _tePerson = tools.open_doc(_teSelfPa.person_id).TopElem;
        // _managerFullname = tools.open_doc(_teManagerPa.expert_person_id).TopElem.fullname;

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
            // _oManagerCompetence = _teManagerPa.competences[i];
            try
            {
                _oManagerCompetence = _teManagerPa.competences[i];
            }
            catch(ex)
            {
                _oManagerCompetence = null;
            }

            setCompetenceLine(_resultObject, _oSelfCompetence, _oManagerCompetence, _teCollPas, _teStaffPas, i);
            _RESULT.push(_resultObject);

            for(j = 0; j < ArrayCount(_oSelfCompetence.indicators); j++) {
                
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
                try
                {
                    _oManagerIndicator = _oManagerCompetence.indicators[j];
                }
                catch(ex)
                {
                    _oManagerIndicator = null;
                }
        
                // _oManagerIndicator = _oManagerCompetence.indicators[j];
                
                setIndicatorLine(_resultObject, _oSelfCompetence, _oSelfIndicator, _oManagerIndicator, _teCollPas, _teStaffPas, i, j);
                _RESULT.push(_resultObject);
            }
        }

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
        // _resultObject.managerScore = replaceNumberSeparator(_teManagerPa.overall);
        try
        {
            _resultObject.managerScore = replaceNumberSeparator(_teManagerPa.overall);
        }
        catch(ex)
        {
            _resultObject.managerScore = replaceNumberSeparator(0);
        }


        _totalColls = 0.0;
        _totalStaffs = 0.0;

        _averageColls = 0.0;
        _averageStaffs = 0.0;
        _averageAll = 0.0;
        _averageAll_minus_self = 0.0;

        _collsCounter = 0;
        _staffsCounter = 0;

        // Average colls
        for(_collPa in _collPas) {

            if(_collPa.is_done) {
                _totalColls += OptReal(_collPa.overall);
                _collsCounter++;
            }
        }

        _averageColls = OptReal(_totalColls / _collsCounter);

        // Average staffs
        for(_staffPa in _staffPas) {

            if(_staffPa.is_done) {
                _totalStaffs += OptReal(_staffPa.overall);
                _staffsCounter++;
            }
        }

        _averageStaffs = OptReal(_totalStaffs / _staffsCounter);

        try
        {
            manager_overall = _teManagerPa.overall;
        }
        catch (e)
        {
            manager_overall = 0.0;
        }
        
        // Average all
        _averageAll = (OptReal(_teSelfPa.overall) + OptReal(manager_overall) + _totalStaffs + _totalColls) / (2 + _staffsCounter + _collsCounter);

        // Average all minus self
        _averageAll_minus_self = (OptReal(manager_overall) + _totalStaffs + _totalColls) / (1 + _staffsCounter + _collsCounter);

        _resultObject.averageColls = replaceNumberSeparator( StrReal(_averageColls, 2) );
        _resultObject.averageStaffs = replaceNumberSeparator( StrReal(_averageStaffs, 2) );
        _resultObject.averageAll = replaceNumberSeparator( StrReal(_averageAll, 2) );
        _resultObject.averageAll_minus_self = replaceNumberSeparator( StrReal(_averageAll_minus_self, 2) );

        _RESULT.push(_resultObject);
    }
    catch(e) 
    {
        Log(String(e));
        alert(e);
    }

}


return _RESULT;