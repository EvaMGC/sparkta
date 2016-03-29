describe('policies.wizard.controller.policy-controller', function () {
  beforeEach(module('webApp'));
  beforeEach(module('model/policy.json'));
  beforeEach(module('template/policy.json'));

  var ctrl, scope, fakePolicy, fakeTemplate, fakeError, policyModelFactoryMock, templateFactoryMock, policyFactoryMock, policyServiceMock,
    stateMock, fakeCreationStatus, modalServiceMock, resolvedPromise, rejectedPromise, fakeFinalPolicyJSON, wizardStatusServiceMock;

  // init mock modules

  beforeEach(inject(function ($controller, $q, $httpBackend, $rootScope, _modelPolicy_, _templatePolicy_) {
    scope = $rootScope.$new();

    fakePolicy = angular.copy(_modelPolicy_);
    fakeTemplate = _templatePolicy_;

    resolvedPromise = function () {
      var defer = $q.defer();
      defer.resolve();

      return defer.promise;
    };

    fakeError = {"data": {"i18nCode": "306", subErrorModels:[{"i18nCode": "402"}]}};
    rejectedPromise = function () {
      var defer = $q.defer();
      defer.reject(fakeError);

      return defer.promise;
    };

    $httpBackend.when('GET', 'languages/en-US.json')
      .respond({});
    fakeCreationStatus = {"currentStep": 0};
    templateFactoryMock = jasmine.createSpyObj('TemplateFactory', ['getPolicyTemplate']);
    templateFactoryMock.getPolicyTemplate.and.callFake(function () {
      var defer = $q.defer();
      defer.resolve(fakeTemplate);
      return defer.promise;
    });
    policyFactoryMock = jasmine.createSpyObj('PolicyFactory', ['createPolicy', 'savePolicy']);
    policyFactoryMock.createPolicy.and.callFake(resolvedPromise);
    policyFactoryMock.savePolicy.and.callFake(resolvedPromise);

    policyServiceMock = jasmine.createSpyObj('PolicyService', ['generateFinalJSON']);

    stateMock = jasmine.createSpyObj('$state', ['go']);

    wizardStatusServiceMock = jasmine.createSpyObj('wizardStatusService', ['getStatus']);
    wizardStatusServiceMock.getStatus.and.returnValue(fakeCreationStatus);
    policyModelFactoryMock = jasmine.createSpyObj('PolicyModelFactory', ['getCurrentPolicy', 'setFinalJSON', 'setError', 'getError', 'getFinalJSON', 'setTemplate', 'getTemplate', 'getProcessStatus', 'resetPolicy']);
    policyModelFactoryMock.getCurrentPolicy.and.callFake(function () {
      return fakePolicy;
    });

    policyModelFactoryMock.getTemplate.and.callFake(function () {
      return fakeTemplate;
    });

    fakeFinalPolicyJSON = {"fake_attribute": "fake value"};

    policyServiceMock.generateFinalJSON.and.callFake(function () {
      var defer = $q.defer();
      defer.resolve(fakeFinalPolicyJSON);
      return defer.promise;
    });

    modalServiceMock = jasmine.createSpyObj('ModalService', ['openModal']);

    modalServiceMock.openModal.and.callFake(function () {
      var defer = $q.defer();
      defer.resolve();
      return {"result": defer.promise};
    });

    ctrl = $controller('PolicyCtrl', {
      'WizardStatusService': wizardStatusServiceMock,
      'PolicyModelFactory': policyModelFactoryMock,
      'TemplateFactory': templateFactoryMock,
      'PolicyFactory': policyFactoryMock,
      'PolicyService': policyServiceMock,
      'ModalService': modalServiceMock,
      '$state': stateMock,
      '$scope': scope
    });

    scope.$digest();
  }));

  describe("when it is initialized", function () {

    it('it should get the policy from policy factory that will be created', function () {
      expect(ctrl.policy).toBe(fakePolicy);
    });

    it("should load the steps of the policy creation/edition from the policy template", function () {
      expect(ctrl.steps).toBe(fakeTemplate.steps);
    });

    it("should load the creation status from the policy model factory", function () {
      expect(wizardStatusServiceMock.getStatus).toHaveBeenCalled();
      expect(ctrl.status).toEqual(fakeCreationStatus);
    });

    describe("if policy is null or undefined", function () {
      beforeEach(inject(function ($controller) {
        policyModelFactoryMock.getCurrentPolicy.and.callFake(function () {
          return null;
        });

        ctrl = $controller('PolicyCtrl', {
          'WizardStatusService': wizardStatusServiceMock,
          'PolicyModelFactory': policyModelFactoryMock,
          'TemplateFactory': templateFactoryMock,
          'PolicyFactory': policyFactoryMock,
          'PolicyService': policyServiceMock,
          'ModalService': modalServiceMock,
          '$state': stateMock,
          '$scope': scope
        });

        scope.$apply();
      }));

      it("user is redirected to policy list page", function () {
        expect(stateMock.go).toHaveBeenCalledWith("dashboard.policies");
      })
    });
  });

  describe("should be able to confirm the sent of the created or modified policy", function () {
    beforeEach(function () {
      ctrl.editionMode = false;
    });

    it("if next step is not available, modal is not open and an event is broadcasted to all children in order to force validate all forms", function () {
      spyOn(scope, '$broadcast');
      ctrl.status.nextStepAvailable = false;
      ctrl.confirmPolicy();

      expect(scope.$broadcast).toHaveBeenCalledWith('forceValidateForm', 1);
    });

    describe("if next step is available", function () {
      beforeEach(function () {
        ctrl.status.nextStepAvailable = true;
      });

      it("modal is opened with the correct params if next step is available", function () {
        ctrl.confirmPolicy();

        expect(modalServiceMock.openModal.calls.mostRecent().args[0]).toBe("ConfirmModalCtrl");
        expect(modalServiceMock.openModal.calls.mostRecent().args[1]).toBe("templates/modal/confirm-modal.tpl.html");
        var resolve = (modalServiceMock.openModal.calls.mostRecent().args[2]);
        expect(resolve.title()).toBe("_POLICY_._WINDOW_._CONFIRM_._TITLE_");
        expect(resolve.message()).toBe("");

        ctrl.editionMode = true;

        expect(modalServiceMock.openModal.calls.mostRecent().args[0]).toBe("ConfirmModalCtrl");
        expect(modalServiceMock.openModal.calls.mostRecent().args[1]).toBe("templates/modal/confirm-modal.tpl.html");
        var resolve = (modalServiceMock.openModal.calls.mostRecent().args[2]);
        expect(resolve.title()).toBe("_POLICY_._WINDOW_._EDIT_._TITLE_");
        expect(resolve.message()).toBe("");


      });

      it("when modal is confirmed, the policy is sent using an http request", function () {
        ctrl.confirmPolicy().then(function () {
          expect(policyFactoryMock.createPolicy).toHaveBeenCalledWith(fakeFinalPolicyJSON);
        });
        scope.$digest();

        ctrl.editionMode = true;

        ctrl.confirmPolicy().then(function () {
          expect(policyFactoryMock.savePolicy).toHaveBeenCalledWith(fakeFinalPolicyJSON);
        });
        scope.$digest();
      });

      it("If the policy is sent successfully, user is redirected to policy list page and policy is reset", function () {
        ctrl.confirmPolicy().then(function () {
          expect(policyModelFactoryMock.resetPolicy).toHaveBeenCalled();
          expect(stateMock.go).toHaveBeenCalledWith("dashboard.policies");
        });
        scope.$digest();
      });

      it("If the policy sent fails, policy error is updated", function () {
        policyFactoryMock.createPolicy.and.callFake(rejectedPromise);
        ctrl.confirmPolicy().then(null, function(){
          expect(policyModelFactoryMock.setError).toHaveBeenCalledWith("_ERROR_._"+ fakeError.data.i18nCode + "_", "error", fakeError.data.subErrorModels);
        });
        scope.$digest();
        policyModelFactoryMock.setError.calls.reset();

        policyFactoryMock.savePolicy.and.callFake(rejectedPromise);
        ctrl.confirmPolicy().then(null, function(){
          expect(policyModelFactoryMock.setError).toHaveBeenCalledWith("_ERROR_._"+ fakeError.data.i18nCode + "_", "error", fakeError.data.subErrorModels);
        });
        scope.$digest();
      });

    })
  });
});
