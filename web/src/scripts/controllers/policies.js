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

  angular
    .module('webApp')
    .controller('PoliciesCtrl', PoliciesCtrl);

  PoliciesCtrl.$inject = ['WizardStatusService', 'PolicyFactory', 'PolicyModelFactory', 'ModalService', '$state',
    '$translate', '$interval', '$filter', '$scope', '$timeout', '$q'];

  function PoliciesCtrl(WizardStatusService, PolicyFactory, PolicyModelFactory, ModalService, $state, $translate, $interval, $filter, $scope, $timeout, $q) {
    /*jshint validthis: true*/
    var vm = this;

    var checkPoliciesStatus = null;

    vm.createPolicy = createPolicy;
    vm.deletePolicy = deletePolicy;
    vm.runPolicy = runPolicy;
    vm.stopPolicy = stopPolicy;
    vm.editPolicy = editPolicy;
    vm.deleteErrorMessage = deleteErrorMessage;

    vm.policiesData = {};
    vm.policiesData.list = undefined;
    vm.policiesJsonData = {};
    vm.error = false;
    vm.success = false;
    vm.errorMessage = '';
    vm.successMessage = '';
    vm.clusterUI = '';

    init();

    /////////////////////////////////

    function init() {
      getPolicies();

      /*Stop $interval when changing the view*/
      $scope.$on("$destroy", function () {
        if (checkPoliciesStatus) {
          $interval.cancel(checkPoliciesStatus);
        }
      });
    }

    function deleteErrorMessage() {
      vm.errorMessage = '';
      vm.errorMessageExtended = '';
    }

    function createPolicy() {
      PolicyModelFactory.resetPolicy();
      WizardStatusService.reset();
      var controller = 'PolicyCreationModalCtrl';
      var templateUrl = "templates/modal/policy-creation-modal.tpl.html";
      var resolve = {
        title: function () {
          return "_POLICY_._MODAL_CREATION_TITLE_";
        }
      };
      var modalInstance = ModalService.openModal(controller, templateUrl, resolve, null, 'lg');
      return modalInstance.result.then(function () {
        WizardStatusService.nextStep();
        $state.go('wizard.newPolicy');
      });
    }

    function editPolicy(route, policyId, policyStatus) {
      vm.errorMessage = "";
      WizardStatusService.reset();
      if (policyStatus.toLowerCase() === 'notstarted' || policyStatus.toLowerCase() === 'failed' || policyStatus.toLowerCase() === 'stopped' || policyStatus.toLowerCase() === 'stopping') {
        $state.go(route, {"id": policyId});
      }
      else {
        $translate('_POLICY_ERROR_EDIT_POLICY_').then(function (value) {
          vm.errorMessage = value;
        });
      }
    }

    function deletePolicy(policyId, policyStatus, index) {
      if (policyStatus.toLowerCase() === 'notstarted' || policyStatus.toLowerCase() === 'failed' || policyStatus.toLowerCase() === 'stopped' || policyStatus.toLowerCase() === 'stopping') {
        var policyToDelete =
        {
          'id': policyId,
          'index': index
        };
        deletePolicyConfirm('lg', policyToDelete);
      }
      else {
        $translate('_POLICY_ERROR_DELETE_POLICY_').then(function (value) {
          vm.error = true;
          vm.success = false;
          vm.errorMessage = value;
        });
      }
    }

    function runPolicy(policyId, policyStatus, policyName) {
      if (policyStatus.toLowerCase() === 'notstarted' || policyStatus.toLowerCase() === 'failed' || policyStatus.toLowerCase() === 'stopped' || policyStatus.toLowerCase() === 'stopping') {
        var policyRunning = PolicyFactory.runPolicy(policyId);

        policyRunning.then(function () {
          $translate('_RUN_POLICY_OK_', {policyName: policyName}).then(function (value) {
            vm.successMessage = value;
            $timeout(function () {
              vm.successMessage = '';
            }, 3000);
          });
          $timeout(function () {
            vm.success = false
          }, 5000);

        }, function (error) {
          $translate('_INPUT_ERROR_' + error.data.i18nCode + '_').then(function (value) {
            vm.errorMessage = value;
            vm.errorMessageExtended = 'Error: ' + error.data.message;
          });
        });
      }
      else {
        $translate('_RUN_POLICY_KO_', {policyName: policyName}).then(function (value) {
          vm.errorMessage = value;
        });
      }
    }

    function stopPolicy(policyId, policyStatus, policyName) {
      if (policyStatus.toLowerCase() !== 'notstarted' && policyStatus.toLowerCase() !== 'stopped' && policyStatus.toLowerCase() !== 'stopping') {

        var stopPolicy =
        {
          "id": policyId,
          "status": "Stopping"
        };

        var policyStopping = PolicyFactory.stopPolicy(stopPolicy);

        policyStopping.then(function () {
          $translate('_STOP_POLICY_OK_', {policyName: policyName}).then(function (value) {
            vm.successMessage = value;
            $timeout(function () {
              vm.successMessage = '';
            }, 3000);
          });
          $timeout(function () {
            vm.success = false
          }, 5000);

        }, function (error) {
          $translate('_INPUT_ERROR_' + error.data.i18nCode + '_').then(function (value) {
            vm.errorMessage = value;
            vm.errorMessageExtended = 'Error: ' + error.data.message;
          });
        });
      }
      else {
        $translate('_STOP_POLICY_KO_', {policyName: policyName}).then(function (value) {
          vm.errorMessage = value;
        });
      }
    }

    function deletePolicyConfirm(size, policy) {
      vm.errorMessage = "";

      var controller = 'DeletePolicyModalCtrl';
      var templateUrl = "templates/policies/st-delete-policy-modal.tpl.html";
      var resolve = {
        item: function () {
          return policy;
        }
      };
      var modalInstance = ModalService.openModal(controller, templateUrl, resolve, '', size);

      modalInstance.result.then(function (selectedPolicy) {
        vm.policiesData.list.splice(selectedPolicy.index, 1);
        $translate('_POLICY_DELETE_OK_').then(function (value) {
          vm.successMessage = value;
          $timeout(function () {
            vm.successMessage = '';
          }, 3000);
          $timeout(function () {
            vm.success = false
          }, 5000);
        });
      });
    }

    function updatePoliciesStatus() {
      var defer = $q.defer();
      var policiesStatus = PolicyFactory.getPoliciesStatus();
      policiesStatus.then(function (result) {
        vm.clusterUI = result.resourceManagerUrl;
        var policiesWithStatus = result.policiesStatus;
        if (policiesWithStatus) {
          for (var i = 0; i < policiesWithStatus.length; i++) {
            var policyData = $filter('filter')(vm.policiesData.list, {'policy': {'id': policiesWithStatus[i].id}}, true)[0];
            if (policyData) {
              policyData.status = policiesWithStatus[i].status;
            }
          }
        }
        defer.resolve();
      });
      return defer.promise;
    }

    function getPolicies() {
      vm.errorMessage = "";
      var policiesList = PolicyFactory.getAllPolicies();

      policiesList.then(function (result) {
        vm.policiesData.list = result;
        updatePoliciesStatus();

        checkPoliciesStatus = $interval(function () {
          updatePoliciesStatus();
        }, 5000);

      }, function (error) {
        $translate('_INPUT_ERROR_' + error.data.i18nCode + '_').then(function (value) {
          vm.successMessage = value;
          $timeout(function () {
            vm.successMessage = '';
          }, 3000);
        });
      });
    }
  }
})();
