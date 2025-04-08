/* --------------- Log --------------- */

EnableLog('/assessments/pd/assessment', true);

function log(message) {
    LogEvent('/assessments/pd/assessment', message);
}

/* --------------- Main program --------------- */

_curAP = curPA.assessment_plan_id.OptForeignElem;

// Для инструкций и отображения различных элементов
_assessmentEnded = String(oData.data.workflow_state)=="completed";
_curPersonIsBoss = String(curUserID) == String(_curAP.boss_id);
_curPersonIsSelf = String(curUserID) == String(_curAP.person_id);

oData.data.config = new Object();
oData.data.config.btn_users = true;
oData.data.config.btn_objectives = false;
oData.data.config.btn_logs = false;
oData.data.config.btn_iframe = false;
oData.data.config.wf_btn_position = "both";

oData.data.type_title = "Результативность";
oData.data.view_type = "table";
oData.data.view_type_level = -1;

// Финальная оценка руководителя
_editableKpiMark = (oData.data.workflow_state == "boss" || oData.data.workflow_state == "dialog_boss");
_visibleKpiMark = oData.data.workflow_state != "self";

_budgetPeriods = ArraySelectAll(XQuery("sql: SELECT id, name FROM budget_periods WHERE id="+curPA.budget_period_id+" or parent_id="+curPA.budget_period_id+""));

// if((oData.data.workflow_state == "boss" || oData.data.workflow_state == "self") && oData.data.editable) {
//     oData.data.class = "current-editable-pa";
//     oData.data.type_title = "<div class='editable-pa-text'>Можно отредактировать</div>" + oData.data.type_title;
// }


if(oData.data.editable) {
    oData.data.class = "current-editable-pa";
    
    if(oData.data.workflow_state == "self" || oData.data.workflow_state == "boss") {
        oData.data.type_title = "<div class='editable-pa-text'>Обязательно для заполнения</div>" + oData.data.type_title;
    } else {
        oData.data.type_title = "<div class='editable-pa-text'>Можно отредактировать</div>" + oData.data.type_title;
    }
} 

if(!_assessmentEnded) {
    if(_curPersonIsSelf) {
        // Инструкция для подчиненного
        oData.data.wfcomment_title = "Инструкция";
        oData.data.wfcomment = SELF_INSTRUCTION;
    } else if(_curPersonIsBoss) {
        // Инструкция для руководителя
        oData.data.wfcomment_title = "Инструкция";
        oData.data.wfcomment = BOSS_INSTRUCTION;
    }
}

oData.data.wfparameters = {
    "can_add_child": "false",
    "can_delete": "false",
    "can_translate": "false",
    "objective": {
        "can_add_child": "false",
        "can_translate": "false",
        "period_fact": {
            "label": "Период",
            "visible": "true",
            "visible_in": "title;form",
            "editable": "true",
            "required": "false",
            "control_type": "select",
            "scale": { value: ArrayExtract(_budgetPeriods, "({'id': This.id+'', 'name': This.name})") },
            "placeholder": "--Выберите период--"
        },
        "name": {
            "label": "Показатель",
            "visible": "true",
            "visible_in": "title;form",
            "editable": "true",
            "required": "true",
            "control_type": "textarea"
        },
        "weight": {
            "label": "Вес показателя",
            "visible": "true",
            "visible_in": "view;form",
            "editable": "true",
            "required": "false",
            "control_type": "number",
            "min": "0",
            "max": "100"
        },
        "plan": {
            "label": "План",
            "visible": "true",
            "visible_in": "view;form",
            "editable": "true",
            "required": "false",
            "control_type": "number"
        },
        "fact": {
            "label": "Факт",
            "visible": "true",
            "visible_in": "view;form",
            "editable": "true",
            "required": "true",
            "control_type": "number",
        },
        "completion_percentage": {
            "label": "Процент выполнения",
            "visible": "true",
            "visible_in": "view;form",
            "editable": "true",
            "required": "false",
            "control_type": "number",
            "min": "0",
            "max": "100"
        },
        // "kpi_mark": {
        //     "label": "Оценка",
        //     "visible": _visibleKpiMark,
        //     "visible_in": "title;form",
        //     "editable": _editableKpiMark,
        //     "required": "false",
        //     "control_type": "select",
        //     "scale": { value: [
        //         {"id": "A", "name": "A"},
        //         {"id": "B", "name": "B"},
        //         {"id": "C", "name": "C"},
        //         {"id": "D", "name": "D"}
        //     ]},
        //     "placeholder": "--Поставьте оценку--"
        // },
        "changed": {
            "visible": "true",
            "visible_in": "",
            "editable": "false",
            "requred" : "false",
            "control_type": "textarea",
            "value": "true"
        }
    }
}

_marks = [];

for(_obj in oData.data.objectives) {

    // Запретить редактирование заранее созданных KPI
    if(_obj.custom_task.value == "false") {
        _obj.can_delete = false;
        _obj.can_add_child = false;
        _obj.editable = false;
    } else {
        _obj.custom_task.value = "true";
        _obj.can_delete = true;
        _obj.can_add_child = true;
        _obj.editable = true;
    }

    // Подсветка для измененной на предыдущем этапе задачи
    if(_obj.changed.value == "prev") {
        _obj.class = "changed-prev-elem";
    }


    // Расчет финальной оценки
    // if(_obj.HasProperty("kpi_mark"))
    // {
    //     _marks.push(_obj.kpi_mark.value);
    // }
}


// Расчет финальной оценки
// _value = "";

// if(ArrayCount(_marks) != 0)
// {
//     _iValue = 0.0;

//     for(_mark in _marks)
//     {
//         if(_mark == "A")
//             _iValue += 3.0;
//         else if(_mark == "B")
//             _iValue += 2.0;
//         else if(_mark == "C")
//             _iValue += 1.0;
//     }

//     _iValue = OptReal( OptReal(_iValue, 0.0) / OptReal(ArrayCount(_marks), 0.0), 0.0);

//     if(_iValue >= 2.5 && _iValue <= 3.0) {
//         _value = "A";
//     } 
//     else if(_iValue >= 2.0 && _iValue <= 2.49) {
//         _value = "B";
//     }
//     else if(_iValue >= 1.0 && _iValue <= 1.99) {
//         _value = "C";
//     }
//     else if(_iValue >= 0 && _iValue <= 0.99) {
//         _value = "D";
//     }
// }

// Финальная оценка (не автоматическая)
_value = ArrayCount(curPA.supplementary_questions) != 0 ? curPA.supplementary_questions[0].supplementary_question_mark : "";


oData.data.wfparameters.objective.buttons = [
    {"action":"add", "title":"Добавить показатель", "position":"bottom", "visible": true }
];


_label = ( (oData.data.workflow_state == "boss" || oData.data.workflow_state == "dialog_boss") && _curPersonIsBoss) ? "Проставьте итоговую оценку, нажав на кнопку <span style='color: #018700'>Поставить оценку</span>" : "Итоговая оценка (проставляется вашим руководителем)";
// _label = (oData.data.workflow_state == "boss" && _curPersonIsBoss) ? "Проставьте оценки во всех целях КПЭ, данная оценка рассчитается автоматически" : "Итоговая оценка (выводится автоматически из оценок за каждую цель КПЭ)";
_visible = !(oData.data.workflow_state == "self");

oData.data.editset = [{
    label: _label,
    editable: _editableKpiMark,
    visible: _visible,
    btn_edit_title: "Поставить оценку",
    resultMark: {
        control_type:"select", 
        label:"Итоговая оценка", 
        visible: true, 
        editable: true, 
        visible_in:"title;view;form",
        value:  _value,
        scale: {
            value: [
                {
                    id: "",
                    name: "-",
                    disabled: true
                },
                {
                    id: "A",
                    name: "A"
                },
                {
                    id: "B",
                    name: "B"
                },
                {
                    id: "C",
                    name: "C"
                },
                {
                    id: "D",
                    name: "D"
                },
            ]
        }
    }
}];

if(oData.data.HasProperty("wfbuttons"))
{
    for(_btn in oData.data.wfbuttons) {

        // Подтверждение для переходов между этапами ДО
        if(_btn.code != "print_ipr" && _btn.code != "comment" && _btn.code != "send_mail_dialog") {
            _btn.confirm_msg = "Данное действие отправит все вкладки на другой этап оценки, где у вас может не быть доступа для их редактирования. Вы уверены, что хотите это сделать?";
        }
    }
}