describe('policies.wizard.controller.policies-controller', function() {
  beforeEach(module('webApp'));
  beforeEach(module('api/policyList.json'));
  beforeEach(module('api/policiesStatusList.json'));

  var ctrl, scope, $interval, $timeout, fakePolicyList, fakePolicyStatusList, fakeError, policyModelFactoryMock, policyFactoryMock,
      stateMock, fakeCreationStatus, modalServiceMock, resolvedPromise, rejectedPromise, fakeFinalPolicyJSON, wizardStatusServiceMock;

  // init mock modules

  beforeEach(inject(function($controller, $q, $httpBackend, $rootScope, _apiPolicyList_, _apiPoliciesStatusList_, _$interval_, _$timeout_) {
    scope = $rootScope.$new();
    $interval = _$interval_;
    $timeout = _$timeout_;
    fakePolicyList = _apiPolicyList_;
    fakePolicyStatusList = _apiPoliciesStatusList_;
    resolvedPromise = function() {
      var defer = $q.defer();
      defer.resolve();

      return defer.promise;
    };

    fakeError = {"data": {"i18nCode": "fake error message"}};
    rejectedPromise = function() {
      var defer = $q.defer();
      defer.reject(fakeError);

      return defer.promise;
    };

    $httpBackend.when('GET', 'languages/en-US.json')
        .respond({});
    fakeCreationStatus = {"currentStep": 0};
    policyFactoryMock = jasmine.createSpyObj('PolicyFactory', ['createPolicy', 'getAllPolicies', 'getPoliciesStatus', 'runPolicy', 'stopPolicy', 'downloadPolicy']);
    policyFactoryMock.getAllPolicies.and.callFake(function() {
      var defer = $q.defer();
      defer.resolve(fakePolicyList);
      return defer.promise;
    });

    policyFactoryMock.getPoliciesStatus.and.callFake(function() {
      var defer = $q.defer();
      defer.resolve(fakePolicyStatusList);
      return defer.promise;
    });
    stateMock = jasmine.createSpyObj('$state', ['go']);

    wizardStatusServiceMock = jasmine.createSpyObj('wizardStatusService', ['getStatus']);
    wizardStatusServiceMock.getStatus.and.returnValue(fakeCreationStatus);
    policyModelFactoryMock = jasmine.createSpyObj('PolicyModelFactory', ['setError',
      'getError', 'getProcessStatus', 'resetPolicy']);

    fakeFinalPolicyJSON = {"fake_attribute": "fake value"};

    modalServiceMock = jasmine.createSpyObj('ModalService', ['openModal']);

    modalServiceMock.openModal.and.callFake(function() {
      var defer = $q.defer();
      defer.resolve();
      return {"result": defer.promise};
    });

    ctrl = $controller('PolicyListCtrl', {
      'WizardStatusService': wizardStatusServiceMock,
      'PolicyModelFactory': policyModelFactoryMock,
      'PolicyFactory': policyFactoryMock,
      'ModalService': modalServiceMock,
      '$state': stateMock,
      '$scope': scope
    });

    scope.$digest();

  }));

  describe("when it is initialized", function() {
    describe("Should request the current policy list and their status", function() {
      beforeEach(function() {
        policyFactoryMock.getPoliciesStatus.calls.reset();
      });


      describe("each 5 seconds, it should update the status of policies", function() {
        it("if server connection is lost, it should abort the updating of policy status", function() {
          policyFactoryMock.getPoliciesStatus.calls.reset();
          policyFactoryMock.getPoliciesStatus.and.callFake(rejectedPromise);
          $interval.flush(25000);
          expect(policyFactoryMock.getPoliciesStatus.calls.count()).toEqual(1);
        });

        describe("while server connection is right, it should update the policy status data", function() {
          it('If policy was already painted, its status data is updated', function() {
            var fakeNewStatus = {
              status: 'stopped',
              statusInfo: 'Status info data',
              submissionId: 'fake submission id'
            };
            fakePolicyStatusList.policiesStatus[0].status = fakeNewStatus.status;
            fakePolicyStatusList.policiesStatus[0].statusInfo = fakeNewStatus.statusInfo;
            fakePolicyStatusList.policiesStatus[0].submissionId = fakeNewStatus.submissionId;

            $interval.flush(5000);
            expect(policyFactoryMock.getPoliciesStatus.calls.count()).toEqual(1);
            $interval.flush(15000);
            expect(policyFactoryMock.getPoliciesStatus.calls.count()).toEqual(4);
            $interval.flush(5000);
            scope.$digest();

            expect(ctrl.policiesData[0].status).toEqual(fakeNewStatus.status);
            expect(ctrl.policiesData[0].statusInfo).toEqual(fakeNewStatus.statusInfo);
            expect(ctrl.policiesData[0].submissionId).toEqual(fakeNewStatus.submissionId);
          });

          it ('if policy was not painted yet, it is added to policy list', function (){
            var oldPolicyListLength = fakePolicyStatusList.policiesStatus.length;
            var newPolicy = angular.copy(fakePolicyStatusList.policiesStatus[0]);
            newPolicy.id = 'new policy id';

            fakePolicyStatusList.policiesStatus.push(newPolicy);
            $interval.flush(15000);
            scope.$digest();
            
            expect(ctrl.policiesData.length).toEqual(oldPolicyListLength + 1);
          });
        });
      });
    })
  });

  describe("should be able to download a policy", function() {
    it("policy factory is called to download the policy passing its id", function() {
      var fakePolicyId = "fake policy id";
      policyFactoryMock.downloadPolicy.and.callFake(resolvedPromise);
      ctrl.downloadPolicy(fakePolicyId);

      expect(policyFactoryMock.downloadPolicy).toHaveBeenCalledWith(fakePolicyId);
    });

    it("a hidden element is created in order to force the file downloading", function() {

    })
  })

});
