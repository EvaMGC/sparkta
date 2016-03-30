/*
 * Copyright (C) 2015 Stratio (http://stratio.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function () {
  'use strict';

  /*POLICY CUBES CONTROLLER*/
  angular
    .module('webApp')
    .controller('CubeCtrl', CubeCtrl);

  CubeCtrl.$inject = ['CubeModelFactory', 'CubeService', 'OutputService', 'PolicyModelFactory', 'ModalService',
    'TriggerService', 'triggerConstants', '$scope'];

  function CubeCtrl(CubeModelFactory, CubeService, OutputService, PolicyModelFactory, ModalService,
                    TriggerService, triggerConstants, $scope) {
    var vm = this;

    vm.init = init;
    vm.addCube = addCube;
    vm.removeCube = CubeService.removeCube;
    vm.isNewCube = CubeService.isNewCube;
    vm.saveCube = CubeService.saveCube;
    vm.isActiveTriggerCreationPanel = TriggerService.isActiveTriggerCreationPanel;
    vm.activateTriggerCreationPanel = activateTriggerCreationPanel;
    vm.changeOpenedTrigger = TriggerService.changeOpenedTrigger;
    vm.isTimeDimension = null;

    vm.addOutputToDimensions = addOutputToDimensions;
    vm.removeOutputFromDimensions = removeOutputFromDimensions;
    vm.addFunctionToOperators = addFunctionToOperators;
    vm.removeFunctionFromOperators = removeFunctionFromOperators;
    vm.addOutput = addOutput;
    vm.showTriggerError = showTriggerError;
    vm.cancelCubeCreation = cancelCubeCreation;

    vm.init();

    function init() {
      vm.outputsWidth = "lg";
      vm.cube = CubeModelFactory.getCube();
      if (vm.cube) {
        vm.template = PolicyModelFactory.getTemplate().cube;
        vm.policy = PolicyModelFactory.getCurrentPolicy();
        vm.granularityOptions = vm.template.granularityOptions;
        vm.functionList = vm.template.functionNames;
        vm.outputList = PolicyModelFactory.getAllModelOutputs();
        vm.cubeError = CubeModelFactory.getError();
        vm.cubeContext = CubeModelFactory.getContext();
        initTriggerAccordion();

        return OutputService.generateOutputNameList().then(function (outputList) {
          vm.policyOutputList = outputList;
        });
      }
    }

    function initTriggerAccordion() {
      vm.selectedPolicyOutput = "";
      vm.triggerAccordionStatus = [];
      vm.triggerContainer = vm.cube.triggers;
      TriggerService.disableTriggerCreationPanel();
      TriggerService.setTriggerContainer(vm.cube.triggers, triggerConstants.CUBE);
      TriggerService.changeVisibilityOfHelpForSql(false);
    }

    function activateTriggerCreationPanel() {
      TriggerService.activateTriggerCreationPanel();
      vm.triggerAccordionStatus[vm.triggerAccordionStatus.length - 1] = true;
    }

    function addOutputToDimensions(outputName) {
      var templateUrl = "templates/policies/dimension-modal.tpl.html";
      var controller = "NewDimensionModalCtrl";
      var extraClass = null;
      var size = 'lg';

      var resolve = {
        fieldName: function () {
          return outputName;
        },
        dimensionName: function () {
          return outputName;
        },
        dimensions: function () {
          return vm.cube.dimensions
        },
        template: function () {
          return vm.template;
        },
        isTimeDimension: function () {
          return vm.isTimeDimension;
        }
      };

      var modalInstance = ModalService.openModal(controller, templateUrl, resolve, extraClass, size);

      return modalInstance.result.then(function (dimensionData) {
        vm.cube.dimensions.push(dimensionData.dimension);
        vm.isTimeDimension = dimensionData.isTimeDimesion;
      });
    }

    function addFunctionToOperators(functionName) {
      var templateUrl = "templates/policies/operator-modal.tpl.html";
      var controller = "NewOperatorModalCtrl";
      var extraClass = null;
      var size = 'lg';
      var resolve = {
        operatorType: function () {
          return functionName;
        },
        operatorName: function () {
          var operatorLength = vm.cube.operators.length + 1;
          return functionName.toLowerCase() + operatorLength;
        },
        operators: function () {
          return vm.cube.operators
        },
        template: function () {
          return vm.template;
        }
      };
      var modalInstance = ModalService.openModal(controller, templateUrl, resolve, extraClass, size);

      return modalInstance.result.then(function (operator) {
        vm.cube.operators.push(operator);
      });
    }

    function showConfirmModal(title, message) {
      var templateUrl = "templates/modal/confirm-modal.tpl.html";
      var controller = "ConfirmModalCtrl";
      var extraClass = null;
      var size = 'lg';
      var resolve = {
        title: function () {
          return title
        },
        message: function () {
          return message;
        }
      };
      var modalInstance = ModalService.openModal(controller, templateUrl, resolve, extraClass, size);
      return modalInstance.result;
    }

    function removeOutputFromDimensions(dimensionIndex, computeLast) {
      var title = "_POLICY_._CUBE_._REMOVE_DIMENSION_CONFIRM_TITLE_";
      return showConfirmModal(title, "").then(function () {
        if (computeLast) {
          vm.isTimeDimension = false;
        }
        vm.cube.dimensions.splice(dimensionIndex, 1);
      })
    }

    function removeFunctionFromOperators(operatorIndex) {
      var title = "_POLICY_._CUBE_._REMOVE_OPERATOR_CONFIRM_TITLE_";
      return showConfirmModal(title, "").then(function () {
        vm.cube.operators.splice(operatorIndex, 1);
      });
    }

    function addCube() {
      vm.triggerError = null;
      CubeModelFactory.setError();
      var valid = true;
      vm.form.$setSubmitted(true);
      if (vm.form['vm.form']) {
        vm.form['vm.form'].$setSubmitted(true);
        vm.triggerAccordionStatus[vm.triggerAccordionStatus.length] = true;
        if (vm.form['vm.form'].$valid && vm.isActiveTriggerCreationPanel()) {
          valid = false;
          vm.triggerError = "_TRIGGER_WITHOUT_SAVE_";
          vm.form['vm.form'].$setSubmitted(false);
        }
      }
      if (vm.form.$valid && vm.cube.operators.length > 0 && vm.cube.dimensions.length > 0) {
        vm.form.$submitted = false;
      } else {
        valid = false;
        CubeModelFactory.setError();
      }
      if (valid) {
        CubeService.addCube();
        CubeService.changeCubeCreationPanelVisibility(false);
      }
    }

    function addOutput() {
      if (vm.selectedPolicyOutput && vm.cube['writer.outputs'].indexOf(vm.selectedPolicyOutput) == -1) {
        vm.cube['writer.outputs'].push(vm.selectedPolicyOutput);
      }
    }

    function showTriggerError() {
      return vm.triggerError && vm.isActiveTriggerCreationPanel() && vm.form['vm.form'] && vm.form['vm.form'].$submitted;
    }

    function cancelCubeCreation() {
      CubeService.disableCubeCreationPanel();
      CubeModelFactory.resetCube(vm.template, CubeService.getCreatedCubes(), vm.cubeContext.position);
    }

    $scope.$on("forceValidateForm", function () {
      vm.form.$submitted = true;
      CubeModelFactory.setError();
    });
  }
})();
